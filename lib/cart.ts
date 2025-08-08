import { supabase } from "./supabase"
import type { CartItem } from "./supabase"

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      *,
      products (
        id,
        name,
        price,
        image_url,
        stock
      )
    `)
    .eq("user_id", userId)

  if (error) throw error
  return data || []
}

export async function addToCart(userId: string, productId: number, quantity = 1) {
  // Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single()

  if (existingItem) {
    // Update quantity
    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity: existingItem.quantity + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingItem.id)

    if (error) throw error
  } else {
    // Insert new item
    const { error } = await supabase.from("cart_items").insert({
      user_id: userId,
      product_id: productId,
      quantity,
    })

    if (error) throw error
  }
}

export async function updateCartItem(itemId: number, quantity: number) {
  if (quantity <= 0) {
    return removeFromCart(itemId)
  }

  const { error } = await supabase
    .from("cart_items")
    .update({
      quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)

  if (error) throw error
}

export async function removeFromCart(itemId: number) {
  const { error } = await supabase.from("cart_items").delete().eq("id", itemId)

  if (error) throw error
}

export async function clearCart(userId: string) {
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId)

  if (error) throw error
}
