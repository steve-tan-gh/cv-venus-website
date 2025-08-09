import { supabase } from "./supabase"
import type { CartItem, Discount, CartWithDiscounts } from "./supabase"

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      *,
      products (
        id,
        name,
        slug,
        price,
        stock,
        image_url,
        is_active,
        category_id,
        brand_id,
        categories (
          id,
          name,
          slug
        ),
        brands (
          id,
          name,
          slug
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function addToCart(userId: string, productId: number, quantity = 1): Promise<void> {
  // First check if product has enough stock
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock, is_active")
    .eq("id", productId)
    .single()

  if (productError) throw productError
  if (!product.is_active) throw new Error("Product is not available")
  if (product.stock < quantity) throw new Error("Not enough stock available")

  // Check if item already exists in cart
  const { data: existingItem, error: existingError } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single()

  if (existingError && existingError.code !== "PGRST116") {
    throw existingError
  }

  if (existingItem) {
    // Update existing item
    const newQuantity = existingItem.quantity + quantity
    if (product.stock < newQuantity) {
      throw new Error("Not enough stock available")
    }

    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingItem.id)

    if (error) throw error
  } else {
    // Add new item
    const { error } = await supabase.from("cart_items").insert({
      user_id: userId,
      product_id: productId,
      quantity,
    })

    if (error) throw error
  }
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number, userId: string): Promise<void> {
  if (quantity <= 0) {
    await removeFromCart(cartItemId, userId)
    return
  }

  // Check stock availability
  const { data: cartItem, error: cartError } = await supabase
    .from("cart_items")
    .select(`
      *,
      products (stock, is_active)
    `)
    .eq("id", cartItemId)
    .eq("user_id", userId)
    .single()

  if (cartError) throw cartError
  if (!cartItem.products?.is_active) throw new Error("Product is not available")
  if ((cartItem.products?.stock || 0) < quantity) throw new Error("Not enough stock available")

  const { error } = await supabase
    .from("cart_items")
    .update({
      quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cartItemId)
    .eq("user_id", userId)

  if (error) throw error
}

export async function removeFromCart(cartItemId: number, userId: string): Promise<void> {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId).eq("user_id", userId)

  if (error) throw error
}

export async function clearCart(userId: string): Promise<void> {
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId)

  if (error) throw error
}

export async function getActiveDiscounts(): Promise<Discount[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("is_active", true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)

  if (error) throw error
  return data || []
}

export async function calculateCartWithDiscounts(userId: string): Promise<CartWithDiscounts> {
  const cartItems = await getCartItems(userId)
  const discounts = await getActiveDiscounts()

  let subtotal = 0
  const appliedDiscounts: CartWithDiscounts["appliedDiscounts"] = []

  // Calculate subtotal
  cartItems.forEach((item) => {
    if (item.products) {
      subtotal += item.products.price * item.quantity
    }
  })

  // Apply discounts
  for (const discount of discounts) {
    let affectedItems: CartItem[] = []

    // Determine which items this discount applies to
    if (discount.applies_to === "all") {
      affectedItems = cartItems.filter((item) => item.products?.is_active)
    } else if (discount.applies_to === "category") {
      affectedItems = cartItems.filter((item) => {
        console.log("Checking category discount:", {
          discountCategoryId: discount.applies_to_id,
          productCategoryId: item.products?.category_id,
          productName: item.products?.name,
          match: item.products?.is_active && item.products.category_id === discount.applies_to_id,
        })
        return item.products?.is_active && item.products.category_id === discount.applies_to_id
      })
    } else if (discount.applies_to === "brand") {
      affectedItems = cartItems.filter((item) => {
        console.log("Checking brand discount:", {
          discountBrandId: discount.applies_to_id,
          productBrandId: item.products?.brand_id,
          productName: item.products?.name,
          match: item.products?.is_active && item.products.brand_id === discount.applies_to_id,
        })
        return item.products?.is_active && item.products.brand_id === discount.applies_to_id
      })
    } else if (discount.applies_to === "product") {
      affectedItems = cartItems.filter((item) => {
        return item.products?.is_active && item.products.id === discount.applies_to_id
      })
    }

    console.log("Discount application:", {
      discountName: discount.name,
      appliesTo: discount.applies_to,
      appliesToId: discount.applies_to_id,
      affectedItemsCount: affectedItems.length,
      totalCartItems: cartItems.length,
    })

    // Calculate total quantity for affected items
    const totalQuantity = affectedItems.reduce((sum, item) => sum + item.quantity, 0)

    if (totalQuantity >= discount.min_quantity) {
      let freeQuantity = 0
      let discountAmount = 0

      if (discount.type === "buy_x_get_y_free") {
        const eligibleSets = Math.floor(totalQuantity / discount.min_quantity)
        freeQuantity = eligibleSets * (discount.free_quantity || 0)

        // Calculate discount amount based on cheapest items
        const itemPrices = affectedItems
          .flatMap((item) => Array(item.quantity).fill(item.products?.price || 0))
          .sort((a, b) => a - b)

        discountAmount = itemPrices.slice(0, freeQuantity).reduce((sum, price) => sum + price, 0)
      } else if (discount.type === "buy_x_get_percentage") {
        const affectedItemsTotal = affectedItems.reduce((sum, item) => {
          return sum + (item.products?.price || 0) * item.quantity
        }, 0)
        discountAmount = affectedItemsTotal * ((discount.discount_percentage || 0) / 100)
      }

      if (discountAmount > 0 || freeQuantity > 0) {
        appliedDiscounts.push({
          discount,
          affectedItems,
          freeQuantity,
          discountAmount,
        })
      }
    }
  }

  const totalDiscount = appliedDiscounts.reduce((sum, applied) => sum + applied.discountAmount, 0)
  const finalTotal = Math.max(0, subtotal - totalDiscount)

  return {
    items: cartItems,
    subtotal,
    appliedDiscounts,
    totalDiscount,
    finalTotal,
  }
}
