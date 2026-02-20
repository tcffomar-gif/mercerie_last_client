"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

const VariantSelector = ({
  product,
  selectedVariants,
  selectedColorImage,
  onVariantSelect,
  onColorSelect,
  locale = "fr",
}) => {
  const t = useTranslations("ProductDetail");
  const [zoomedImage, setZoomedImage] = useState(null);

  return (
    <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      {product.variant_color?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("model")}
            </h3>
            {selectedColorImage?.type && (
              <span className="text-sm text-[#D4B814] font-medium">
                {selectedColorImage.type}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {product.variant_color.map((item, idx) => {
              const isActive = selectedColorImage?.type === item.type;
              return (
                <motion.div
                  key={item.type + idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={(e) => {
                    onColorSelect(item);
                    setZoomedImage(item.img?.secure_url || "/images/gg1.webp");
                  }}
                  className={`relative rounded-2xl overflow-hidden border-3 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "border-[#D4B814] ring-4 ring-[#D4B814]/40 shadow-lg"
                      : "border-gray-300 dark:border-gray-600 hover:border-[#EDD658] hover:shadow-md"
                  }`}
                >
                  <div
                    className="aspect-square relative bg-gray-50 dark:bg-gray-900"
                    // onClick={(e) => {

                    // }}
                  >
                    <Image
                      src={item.img?.secure_url || "/images/gg1.webp"}
                      alt={item.type}
                      fill
                      sizes="(max-width: 768px) 33vw, 100px"
                      className="object-cover cursor-zoom-in"
                    />

                    {/* Overlay gradient et texte superposé */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3 py-3 pointer-events-none">
                      <p className="font-semibold text-white text-sm truncate">
                        {item.type}
                      </p>
                      {item.priceAdjustment ? (
                        <p className="text-xs text-gray-200 mt-0.5">
                          +{item.priceAdjustment.toLocaleString()} DA
                        </p>
                      ) : null}
                    </div>

                    {/* Check icon pour sélection */}
                    {isActive && (
                      <div className="absolute top-2 right-2 bg-[#D4B814] text-white rounded-full p-1.5 shadow-lg pointer-events-none">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {product.variant?.length > 0 && (
        <div className="space-y-4">
          {product.variant.map((variant, vIdx) => {
            const variantKey = variant.type.fr;
            const selectedValue = selectedVariants?.[variantKey]?.value;

            return (
              <div key={variantKey + vIdx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {variant.type?.[locale] || variant.type.fr}
                  </p>
                  {selectedValue && (
                    <span className="text-sm text-[#D4B814]">
                      {selectedValue}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {variant.array_value.map((valueObj, idx) => {
                    const value =
                      typeof valueObj === "object" ? valueObj.value : valueObj;
                    const priceAdjustment =
                      typeof valueObj === "object"
                        ? valueObj.priceAdjustment || 0
                        : 0;
                    const isSelected = selectedValue === value;
                    return (
                      <motion.button
                        key={`${variantKey}-${value}-${idx}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() =>
                          onVariantSelect(variantKey, value, priceAdjustment)
                        }
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition ${
                          isSelected
                            ? "bg-[#D4B814] border-[#D4B814] text-white shadow-md"
                            : "border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 hover:border-[#EDD658]"
                        }`}
                      >
                        <span>{value}</span>
                        {priceAdjustment !== 0 && (
                          <span
                            className={`ml-1 text-xs ${isSelected ? "text-white/80" : "text-gray-500"}`}
                          >
                            ({priceAdjustment > 0 ? "+" : ""}
                            {priceAdjustment} DZD)
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-6 right-6 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 z-10"
              aria-label={t("close")}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-[90vw] max-h-[90vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={zoomedImage}
                alt={t("zoomAlt")}
                width={1200}
                height={1200}
                className="object-contain w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VariantSelector;
