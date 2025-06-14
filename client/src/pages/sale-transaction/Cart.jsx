import { useState } from 'react';

export default function Cart() {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Swedish Massage', price: 80, qty: 1 },
    { id: 2, name: 'Facial Treatment', price: 120, qty: 2 },
  ]);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleRemove = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="flex-1 rounded-xl bg-muted/50 p-4 max-h-[600px] overflow-y-auto">
      <h3 className="font-semibold text-lg mb-4">Cart</h3>
      {cartItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items in cart</p>
      ) : (
        <ul className="space-y-2">
          {cartItems.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center p-2 bg-muted rounded"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Qty: {item.qty} × ${item.price}
                </p>
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                className="text-red-500 hover:underline text-sm"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Cart Total */}
      <div className="border-t mt-4 pt-4 text-right">
        <p className="font-semibold text-base">
          Total: <span className="text-primary">${total.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}
