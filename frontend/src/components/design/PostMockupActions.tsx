"use client";

import React from "react";

const PostMockupActions: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void> | void;
  onEdit: () => void;
  onAddToCart: () => Promise<void> | void;
}> = ({ open, onClose, onSave, onEdit, onAddToCart }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-6 z-10">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Mockups ready</h3>
          <p className="text-sm text-gray-600">What would you like to do next?</p>
        </div>
        <div className="space-y-3">
          <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700" onClick={() => onSave()}>Save design</button>
          <button className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg hover:bg-gray-300" onClick={onEdit}>Go back and edit</button>
          <button className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700" onClick={() => onAddToCart()}>Add to cart</button>
        </div>
      </div>
    </div>
  );
};

export default PostMockupActions;


