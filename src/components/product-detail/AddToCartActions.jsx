"use client";

import React from "react";
import { ShoppingCart, Send, Loader2 } from "lucide-react";

const AddToCartActions = ({ onAddToCart, onBuyNow, isLoading, disabled, currentPrice }) => {
  return (
    <div className="space-y-3">
      <button
        onClick={onAddToCart}
        disabled={disabled || isLoading}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-[#D4B814] text-[#D4B814] font-semibold py-3 rounded-xl transition hover:bg-[#FFF9E6] dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
        <span>Ajouter au panier</span>
      </button>
      <button
        onClick={onBuyNow}
        disabled={disabled || isLoading}
        className="w-full flex items-center justify-center gap-3 bg-[#D4B814] hover:bg-[#EDD658] text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        <span>Acheter maintenant{currentPrice ? ` • ${currentPrice.toLocaleString()} DZD` : ""}</span>
      </button>
    </div>
  );
};

export default AddToCartActions;
