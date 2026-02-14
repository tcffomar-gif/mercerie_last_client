
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import { FaChevronLeft, FaChevronRight, FaArrowLeft, FaExpand } from "react-icons/fa";
import { calculerPourcentageReduction } from "assets/les_fontion";
import { PublishedWithChanges, LocalOffer, LocalShipping, SafetyCheckOutlined } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import PhotoSwipe from 'photoswipe';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';



const ProductDetail = ({ product }) => {
  const [mainImage, setMainImage] = useState(
    product.array_ProductImg[0]?.secure_url || ""
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const lightboxRef = useRef(null);
  const galleryRef = useRef(null);

  // Mettre à jour l'image principale lorsque l'index change
  useEffect(() => {
    if (product.array_ProductImg[currentImageIndex]?.secure_url) {
      setMainImage(product.array_ProductImg[currentImageIndex].secure_url);
    }
  }, [currentImageIndex, product.array_ProductImg]);

  // Fonction pour ouvrir PhotoSwipe
  const openLightbox = useCallback((index = currentImageIndex) => {
    if (!lightboxRef.current) {
      // Créer les données pour PhotoSwipe
      const items = product.array_ProductImg.map((img) => ({
        src: optimizeCloudinaryUrl(img.secure_url),
        width: 1200,
        height: 1200,
      }));

      // Créer une instance PhotoSwipe
      const pswp = new PhotoSwipe({
        dataSource: items,
        index: index,
        wheelToZoom: true,
        pinchToClose: true,
        closeOnVerticalDrag: true,
        bgOpacity: 0.97,
        spacing: 0.1,
        allowPanToNext: true,
        loop: true,
        zoom: true,
        maxZoomLevel: 4,
        pswpModule: PhotoSwipe,
      });

      // Event listener pour synchroniser l'index
      pswp.on('change', () => {
        setCurrentImageIndex(pswp.currIndex);
      });

      lightboxRef.current = pswp;
      pswp.init();
    } else {
      lightboxRef.current.goTo(index);
    }
  }, [currentImageIndex, product.array_ProductImg]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
        lightboxRef.current = null;
      }
    };
  }, []);

  // Navigation
  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === product.array_ProductImg.length - 1 ? 0 : prevIndex + 1
    );
  }, [product.array_ProductImg.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? product.array_ProductImg.length - 1 : prevIndex - 1
    );
  }, [product.array_ProductImg.length]);

  // Swipe Detection
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const dragEnd = e.clientX;
    const diff = dragStart - dragEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextImage, handlePrevImage]);

  // Optimize Cloudinary URL
  const optimizeCloudinaryUrl = useCallback((url) => {
    if (!url) return '';
    return url.replace('/upload/', '/upload/q_auto:good,f_webp,w_1200,h_1200,c_limit/');
  }, []);

  // Gérer la sélection des variantes et calculer le prix
  const handleVariantSelect = (variantType, value, priceAdjustment = 0) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantType]: { value, priceAdjustment }
    }));
  };

  // Calculer le prix total en fonction des variantes sélectionnées
  useEffect(() => {
    let totalPrice = product.price;
    
    Object.values(selectedVariants).forEach(variant => {
      totalPrice += variant.priceAdjustment || 0;
    });

    setCurrentPrice(totalPrice);
  }, [selectedVariants, product.price]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-24 md:pb-4 md:mt-6">
      {/* Header Navigation */}
      <div className="sticky top-0 z-40 bg-white shadow-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/Produits">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FaArrowLeft className="text-or_color2 text-lg" />
            </button>
          </Link>
          <h1 className="text-sm font-semibold text-gray-900 line-clamp-1">{product.title.fr}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          
          {/* Professional Premium Gallery Section - 2026 Standard */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-20 lg:h-fit">
            {/* Main Gallery Container */}
            <div ref={galleryRef}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative overflow-hidden rounded-3xl lg:rounded-[32px] shadow-2xl bg-white group cursor-zoom-in"
                onClick={() => openLightbox(currentImageIndex)}
              >
                {/* Image Container */}
                <div 
                  className="aspect-square w-full relative bg-white flex items-center justify-center select-none"
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                >
                  {mainImage ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full relative"
                      >
                        <Image
                          src={optimizeCloudinaryUrl(mainImage)}
                          alt="Product Image"
                          width={800}
                          height={800}
                          priority={true}
                          unoptimized={true}
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-3 border-gray-300 border-t-or_color2 rounded-full"
                      />
                      <span className="text-gray-500 font-medium">Chargement...</span>
                    </motion.div>
                  )}

                  {/* Overlay Gradient on Hover */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  />

                  {/* Premium Zoom Button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(currentImageIndex);
                    }}
                    className="absolute top-5 right-5 bg-white/95 backdrop-blur-md hover:bg-white text-or_color2 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 z-20 opacity-0 group-hover:opacity-100 border border-white/50 hover:border-or_color2/30"
                    aria-label="Ouvrir le zoom"
                  >
                    <FaExpand className="text-xl" />
                  </motion.button>

                  {/* Premium Navigation Buttons */}
                  {product.array_ProductImg.length > 1 && (
                    <>
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        whileHover={{ scale: 1.2, x: -6 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevImage();
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md hover:bg-white text-gray-800 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 opacity-0 group-hover:opacity-100 border border-white/50 hover:border-or_color2/30 z-10"
                        aria-label="Image précédente"
                      >
                        <FaChevronLeft className="text-lg" />
                      </motion.button>

                      <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        whileHover={{ scale: 1.2, x: 6 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextImage();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md hover:bg-white text-gray-800 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 opacity-0 group-hover:opacity-100 border border-white/50 hover:border-or_color2/30 z-10"
                        aria-label="Image suivante"
                      >
                        <FaChevronRight className="text-lg" />
                      </motion.button>

                      {/* Image Counter Badge */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="absolute bottom-5 right-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl border border-white/10 backdrop-blur-md pointer-events-none"
                      >
                        <motion.span
                          key={currentImageIndex}
                          initial={{ scale: 0.8, y: 5 }}
                          animate={{ scale: 1, y: 0 }}
                          className="inline-block"
                        >
                          {currentImageIndex + 1}/{product.array_ProductImg.length}
                        </motion.span>
                      </motion.div>

                      {/* Progress Bar */}
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: (currentImageIndex + 1) / product.array_ProductImg.length }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-or_color2 via-orange-400 to-or_color pointer-events-none"
                        style={{ transformOrigin: 'left' }}
                      />
                    </>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Premium Thumbnail Gallery */}
            {product.array_ProductImg.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex gap-3 overflow-x-auto pb-2 md:pb-0 snap-x snap-mandatory scrollbar-hide"
              >
                {product.array_ProductImg.map((image, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCurrentImageIndex(index);
                    }}
                    onDoubleClick={() => openLightbox(index)}
                    className={`flex-shrink-0 relative rounded-2xl overflow-hidden border-2 transition-all duration-300 snap-start group cursor-pointer ${
                      currentImageIndex === index
                        ? 'border-or_color2 ring-2 ring-or_color2/40 shadow-xl scale-105'
                        : 'border-gray-200 hover:border-or_color2/50 hover:shadow-lg'
                    }`}
                  >
                    <div className="h-24 w-24 md:h-28 md:w-28 relative overflow-hidden bg-gray-100">
                      <Image
                        src={optimizeCloudinaryUrl(image.secure_url)}
                        alt={`Thumbnail ${index + 1}`}
                        width={112}
                        height={112}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        unoptimized={true}
                        loading="lazy"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      {/* {currentImageIndex === index && (
                        <motion.div
                          layoutId="active-thumbnail"
                          className="absolute inset-2 border-2 border-or_color2 rounded-lg"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )} */}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Info Badge */}
            {/* <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="px-5 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200/50 backdrop-blur-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openLightbox(currentImageIndex)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
                    {product.array_ProductImg.length}
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {product.array_ProductImg.length} photo{product.array_ProductImg.length > 1 ? 's' : ''}
                  </p>
                </div>
                <motion.span 
                  className="text-xs font-semibold text-blue-600 flex items-center gap-1"
                  whileHover={{ x: 2 }}
                >
                  <FaExpand className="text-blue-500" />
                  <span>Cliquez pour zoomer</span>
                </motion.span>
              </div>
            </motion.div> */}
          </div>

          {/* Product Details Section */}
          <div className="flex flex-col gap-6">
            
            {/* Product Header */}
            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {product.title.fr}
              </h1>
              
              {/* Price Section */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-or_color2">
                    {currentPrice} DZD
                  </span>
                  {product.ancien_price > product.price && (
                    <>
                      <span className="text-lg md:text-xl line-through text-gray-500">
                        {product.ancien_price} DZD
                      </span>
                      <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {calculerPourcentageReduction(product.ancien_price, product.price)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 text-base leading-relaxed">
                {product.description.fr}
              </p>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 pt-2">
                <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <LocalShipping className="text-or_color2 text-xl" />
                  <span className="text-xs md:text-sm text-gray-700 text-center font-medium">Livraison</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <SafetyCheckOutlined className="text-or_color2 text-xl" />
                  <span className="text-xs md:text-sm text-gray-700 text-center font-medium">Sécurisé</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <LocalOffer className="text-or_color2 text-xl" />
                  <span className="text-xs md:text-sm text-gray-700 text-center font-medium">Offres</span>
                </div>
              </div>
            </div>

            {/* Variants Section */}
            <div className="space-y-6 divide-y">
              
              {/* Colors Variants */}
              {product.variant_color && product.variant_color.length > 0 && (
                <div className="pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Couleurs disponibles</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {product.variant_color.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleVariantSelect('couleur', item.type, item.priceAdjustment || 0)}
                        className={`group relative rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                          selectedVariants['couleur']?.value === item.type
                            ? 'ring-2 ring-or_color2 shadow-lg'
                            : 'hover:shadow-md'
                        }`}
                      >
                        <Image
                          src={optimizeCloudinaryUrl(item.img.secure_url)}
                          alt={item.type}
                          width={120}
                          height={120}
                          className="w-full aspect-square object-cover"
                          loading="lazy"
                          unoptimized={true}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-sm font-medium">{item.type}</p>
                          {item.priceAdjustment > 0 && (
                            <p className="text-white text-xs opacity-90">+{item.priceAdjustment} DA</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Variants */}
              {product.variant && product.variant.length > 0 && (
                <div className="pt-6">
                  <div className="space-y-5">
                    {product.variant.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          {item.type.fr}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {item.array_value.map((valueObj, idx) => {
                            const value = typeof valueObj === 'object' ? valueObj.value : valueObj;
                            const priceAdjustment = typeof valueObj === 'object' ? valueObj.priceAdjustment : 0;
                            
                            return (
                              <button
                                key={idx}
                                onClick={() => handleVariantSelect(item.type.fr, value, priceAdjustment)}
                                className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                                  selectedVariants[item.type.fr]?.value === value
                                    ? 'bg-or_color2 border-or_color2 text-gray-900 shadow-lg'
                                    : 'border-gray-300 text-gray-700 hover:border-or_color2 hover:bg-gray-50'
                                }`}
                              >
                                {value}
                                {priceAdjustment !== 0 && (
                                  <span className="ml-2 text-xs opacity-75">
                                    {priceAdjustment > 0 ? '+' : ''}{priceAdjustment} DA
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discounts Section */}
              {product.reduction && product.reduction.length > 0 && (
                <div className="pt-6">
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <LocalOffer className="text-or_color2 text-lg" />
                      <h3 className="font-semibold text-gray-900">Réductions disponibles</h3>
                    </div>
                    <ul className="space-y-2">
                      {product.reduction.map((reduction, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="inline-block w-1.5 h-1.5 bg-or_color2 rounded-full mt-1.5 flex-shrink-0" />
                          <span>
                            Achetez <span className="font-semibold text-or_color2">{reduction.quantite}</span> pour économiser <span className="font-semibold text-red-600">{reduction.reduction} DZD</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 space-y-3 mb-3">
              <Link href={`/update_product/${product._id}`} className="w-full">
                <button className="w-full bg-gradient-to-r from-or_color2 to-or_color hover:from-or_color hover:to-or_color2 text-gray-900 font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2">
                  <PublishedWithChanges />
                  Modifier Produit
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl md:hidden z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
          <Link href={`/update_product/${product._id}`} className="flex-1">
            <button className="w-full bg-gradient-to-r from-or_color2 to-or_color hover:from-or_color hover:to-or_color2 text-gray-900 font-bold py-2 px-3 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-1">
              <PublishedWithChanges className="text-base" />
              Modifier
            </button>
          </Link>
          <Link href="/Produits" className="flex-1">
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-2 px-3 rounded-lg transition-all duration-300 text-sm">
              Retour
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
