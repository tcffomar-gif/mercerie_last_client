"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { wilayasWithPrices } from "assets/array_wilaya";
import { calculateTotalPrice } from "assets/les_fontion";
import { useCart } from "contexts/CartContext";
import ProductGallery from "components/product-detail/ProductGallery";
import ProductInfo from "components/product-detail/ProductInfo";
import VariantSelector from "components/product-detail/VariantSelector";
import QuantitySelector from "components/product-detail/QuantitySelector";
import AddToCartActions from "components/product-detail/AddToCartActions";
import CustomerReviews from "components/product-detail/CustomerReviews";
import OrderForm from "components/product-detail/OrderForm";
import RelatedProducts from "./RelatedProducts";

const ProductDetail = ({ product, price_min }) => {
  const { data: session, status } = useSession();
  const t = useTranslations("ProductDetail");
  const t_order = useTranslations("CartPage");
  const locale = useLocale();
  const { incrementCartCount } = useCart();

  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedColorImage, setSelectedColorImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState(product?.comments || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [centers, setCenters] = useState([]);
  const [isLoadingCenters, setIsLoadingCenters] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    confirmedPhoneNumber: "",
    wilaya: "",
    deliveryType: "relayPoint",
    commune: "",
    relayPoint: null,
    address: "",
  });

  const [subtotal, setSubtotal] = useState(product.price);
  const [deliveryFees, setDeliveryFees] = useState(0);
  const [total, setTotal] = useState(product.price);
  const [priceDetails, setPriceDetails] = useState({
    basePrice: product.price,
    adjustments: 0,
    discountedPrice: product.price,
    quantity: 1,
  });

  const selectedWilaya = useMemo(
    () => wilayasWithPrices.find((w) => w.name_sans_Nm === formData.wilaya),
    [formData.wilaya]
  );
  const communes = useMemo(() => selectedWilaya?.communes || [], [selectedWilaya]);

  const currentPrice = useMemo(() => {
    let calculated = product.price;
    Object.values(selectedVariants).forEach((variant) => {
      calculated += variant.priceAdjustment || 0;
    });
    if (selectedColorImage?.priceAdjustment) {
      calculated += selectedColorImage.priceAdjustment;
    }
    return calculated;
  }, [product.price, selectedVariants, selectedColorImage]);

  const missingVariants = useMemo(() => {
    const missing = product.variant
      .filter((variant) => !selectedVariants[variant.type.fr])
      .map((variant) => variant.type[locale] || variant.type.fr);
    if (product.variant_color?.length && !selectedColorImage) {
      missing.push(t("model"));
    }
    return missing;
  }, [product, selectedVariants, selectedColorImage, locale]);

  const isDisabled = missingVariants.length > 0;

  const handleVariantSelect = useCallback((variantType, value, priceAdjustment) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantType]: { value, priceAdjustment },
    }));
  }, []);

  const handleColorSelect = useCallback((color) => {
    setSelectedColorImage(color);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "wilaya" || name === "deliveryType"
        ? {
            commune: "",
            relayPoint: null,
          }
        : {}),
    }));
  }, []);

  const handleRelaySelect = useCallback(
    (centerId) => {
      const selectedCenter = centers.find((c) => `${c.center_id}` === `${centerId}`);
      setFormData((prev) => ({
        ...prev,
        relayPoint: selectedCenter || null,
        commune: selectedCenter?.commune_name || prev.commune,
      }));
    },
    [centers]
  );

  useEffect(() => {
    let totalAdjustments = Object.values(selectedVariants).reduce(
      (sum, variant) => sum + (variant.priceAdjustment || 0),
      0
    );
    totalAdjustments += selectedColorImage?.priceAdjustment || 0;

    const adjustedBasePrice = product.price + totalAdjustments;
    const totalQuantity = quantity;
    const discountedPrice = calculateTotalPrice(
      product.reduction,
      totalQuantity,
      adjustedBasePrice
    );

    let fees = 0;
    if (formData.wilaya && formData.deliveryType) {
      const wilaya = wilayasWithPrices.find((w) => w.name_sans_Nm === formData.wilaya);
      if (wilaya) {
        const baseFee =
          formData.deliveryType === "homeDelivery" ? wilaya.homeDelivery : wilaya.relayPoint;
        const supplement = wilaya.communes.find((c) => c.name === formData.commune)?.supplement || 0;
        fees = baseFee + supplement;
      }
    }

    setPriceDetails({
      basePrice: product.price,
      adjustments: totalAdjustments,
      discountedPrice: discountedPrice / Math.max(totalQuantity, 1),
      quantity: totalQuantity,
    });

    setSubtotal(discountedPrice);
    setDeliveryFees(fees);
    setTotal(discountedPrice + fees);
  }, [quantity, product, selectedVariants, selectedColorImage, formData.wilaya, formData.commune, formData.deliveryType]);

  const getOrCreateUniqueId = () => {
    let uniqueId = localStorage.getItem("unique_id");
    if (!uniqueId) {
      uniqueId = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      localStorage.setItem("unique_id", uniqueId);
    }
    return uniqueId;
  };

  const getCartItems = async (id_user) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MY_URL}/api/get_cart_client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_user }),
      });

      if (!res.ok) throw new Error("Failed to fetch cart");

      return await res.json();
    } catch (err) {
      console.error("Error fetching cart:", err);
      return [];
    }
  };

  const getTotalQuantityInCart = (cartItems) =>
    cartItems
      .filter((item) => item.id_product._id === product._id)
      .reduce((sum, item) => sum + item.quantite, 0);

  const normalizeCaracteristique = (caracteristique) => {
    if (!caracteristique) return "";
    return Object.keys(caracteristique)
      .sort()
      .map((key) => `${key}:${caracteristique[key]}`)
      .join("|");
  };

  const handleAddToCart = useCallback(
    async (id_user) => {
      if (isDisabled) {
        toast.error(t("selectVariant", { variant: missingVariants.join(", ") }));
        return;
      }

      setIsLoading(true);
      try {
        let totalPriceAdjustment = 0;
        const caracteristique = product.variant.reduce((acc, variant) => {
          const selected = selectedVariants[variant.type.fr];
          acc[variant.type.fr] = selected.value;
          totalPriceAdjustment += selected.priceAdjustment || 0;
          return acc;
        }, {});
        totalPriceAdjustment += selectedColorImage?.priceAdjustment || 0;

        const finalUnitPrice = product.price + totalPriceAdjustment;
        const cartItems = await getCartItems(id_user);
        const totalQuantityInCart = getTotalQuantityInCart(cartItems);
        const totalQuantity = totalQuantityInCart + quantity;
        const discountedPrice = calculateTotalPrice(product.reduction, totalQuantity, finalUnitPrice);

        const cartItem = {
          id_user,
          id_product: product._id,
          quantite: quantity,
          caracteristique,
          caracteristique_couleur: {
            type: selectedColorImage?.type || "",
            img: selectedColorImage?.img?.secure_url || "",
          },
          priceData: {
            basePrice: product.price,
            priceAdjustment: totalPriceAdjustment,
            unitPrice: finalUnitPrice,
            totalPrice: finalUnitPrice * quantity,
          },
        };

        const caracteristiqueKey = normalizeCaracteristique(caracteristique);
        const selectedColorType = selectedColorImage?.type || "";
        const selectedColorImg = selectedColorImage?.img?.secure_url || "";
        const matchingItem = cartItems.find((item) => {
          if (item.id_product._id !== product._id) return false;
          const itemCaracteristiqueKey = normalizeCaracteristique(item.caracteristique);
          if (itemCaracteristiqueKey !== caracteristiqueKey) return false;
          const itemColorType = item.caracteristique_couleur?.type || "";
          const itemColorImg = item.caracteristique_couleur?.img || "";
          return itemColorType === selectedColorType && itemColorImg === selectedColorImg;
        });

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_MY_URL}/${matchingItem ? "api/update_cart_quantite" : "api/addProduct_in_cart_client"}`,
          {
            method: matchingItem ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              matchingItem
                ? { _id: matchingItem._id, quantite: matchingItem.quantite + quantity }
                : cartItem
            ),
          }
        );

        if (!res.ok) throw new Error("Failed to add product to cart");

        if (!matchingItem) {
          incrementCartCount(1);
        }
        toast.success(t("productAddedToCart"));
        setSubtotal(discountedPrice);
        setTotal(discountedPrice + deliveryFees);
        // window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast.error(t("failedToAddProduct"));
      } finally {
        setIsLoading(false);
      }
    },
    [deliveryFees, incrementCartCount, isDisabled, missingVariants, product, quantity, selectedColorImage, selectedVariants, t]
  );

  const handleSendOrder = async () => {
    if (isDisabled) {
      toast.error(t("selectVariant", { variant: missingVariants.join(", ") }));
      return;
    }

    setIsLoading(true);

    if (
      !formData.fullName ||
      !formData.phoneNumber ||
      !formData.confirmedPhoneNumber ||
      !formData.wilaya ||
      !formData.deliveryType
    ) {
      toast.error(t_order("fillRequiredFields"));
      setIsLoading(false);
      return;
    }

    if (formData.phoneNumber !== formData.confirmedPhoneNumber) {
      toast.error(t_order("phoneNumbersDoNotMatch"));
      setIsLoading(false);
      return;
    }

    if (formData.deliveryType === "relayPoint" && !formData.relayPoint) {
      toast.error(t_order("selectRelayPoint"));
      setIsLoading(false);
      return;
    }

    if (formData.deliveryType === "homeDelivery" && (!formData.commune || !formData.address)) {
      toast.error(t_order("fillAddressFields"));
      setIsLoading(false);
      return;
    }

    try {
      let totalPriceAdjustment = 0;
      const caracteristique = {};
      product.variant.forEach((variant) => {
        const selected = selectedVariants[variant.type.fr];
        caracteristique[variant.type.fr] = selected.value;
        totalPriceAdjustment += selected.priceAdjustment || 0;
      });
      totalPriceAdjustment += selectedColorImage?.priceAdjustment || 0;

      const basePrice = product.price;
      const adjustedPrice = basePrice + totalPriceAdjustment;
      const totalQuantity = quantity;
      const discountedPrice = calculateTotalPrice(product.reduction, totalQuantity, adjustedPrice);

      if (discountedPrice < price_min) {
        toast.error(t_order("minPriceError", { price: price_min }));
        setIsLoading(false);
        return;
      }

      const id_user = status === "authenticated" ? session?.user?._id : getOrCreateUniqueId();
      const orderData = {
        id_user,
        array_product: [
          {
            id_product: product._id,
            quantite: quantity,
            price: adjustedPrice,
            caracteristique,
            caracteristique_couleur: {
              type: selectedColorImage?.type || "",
              img: selectedColorImage?.img?.secure_url || "",
            },
          },
        ],
        status: "en attente",
        createdAt: new Date(),
        customerDetails: {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          wilaya: formData.wilaya,
          deliveryType: formData.deliveryType,
          commune: formData.commune,
          ...(formData.deliveryType === "homeDelivery" && { address: formData.address }),
          ...(formData.deliveryType === "relayPoint" && formData.relayPoint
            ? {
                relayPoint: {
                  center_id: Number(formData.relayPoint.center_id),
                  name: formData.relayPoint.name,
                  address: formData.relayPoint.address,
                  commune_id: Number(formData.relayPoint.commune_id),
                  commune_name: formData.relayPoint.commune_name,
                  wilaya_id: Number(formData.relayPoint.wilaya_id),
                  wilaya_name: formData.relayPoint.wilaya_name,
                },
              }
            : {}),
        },
        deliveryFees,
        total: discountedPrice + deliveryFees,
      };

      const res = await fetch("/api/addOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error("Failed to create order");

      await fetch("/api/update_Product_PurchaseCount", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_product: product._id, quantite: quantity }),
      });

      toast.success(t_order("orderSentSuccessfully"));
      setIsModalOpen(false);
      setSelectedVariants({});
      setSelectedColorImage(null);
      setQuantity(1);
    } catch (error) {
      console.error("Order error:", error);
      toast.error(t_order("orderError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!name || !email || !review) {
      toast.error(t("fillAllFields"));
      return;
    }

    setIsSubmittingReview(true);
    const newComment = {
      name,
      email,
      rating,
      avis: review,
      createdAt: new Date().toISOString(),
    };

    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_MY_URL}/api/add_commante`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComment),
      });

      if (!result.ok) {
        toast.error(t("failedToAddComment"));
        setIsSubmittingReview(false);
        return;
      }

      const data_comment = await result.json();
      const linkBody = { _id: product._id, id_comment: data_comment._id };
      await fetch(`${process.env.NEXT_PUBLIC_MY_URL}/api/add_commante_in_product`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkBody),
      });

      setComments((prev) => [...prev, newComment]);
      setName("");
      setEmail("");
      setReview("");
      setRating(0);
      toast.success(t("thankYouForReview"));
    } catch (err) {
      console.error(err);
      toast.error(t("failedToAddComment"));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const fetchCenters = useCallback(
    async (wilayaId) => {
      if (!wilayaId) return;
      if (wilayaId === 23) {
        setCenters([
          {
            center_id: 230101,
            name: "Magasin Crystal Mercerie",
            address: "Magasin Crystal Mercerie - Rue Asla Hocine",
            commune_id: 2301,
            commune_name: "Annaba",
            wilaya_id: 23,
            wilaya_name: "Annaba",
          },
        ]);
        return;
      }

      try {
        setIsLoadingCenters(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_MY_URL}/api/yalidin?wilaya=${wilayaId}`);
        const data = await response.json();
        setCenters(data || []);
      } catch (error) {
        console.error("Error fetching centers:", error);
        toast.error(t("centersFetchError"));
      } finally {
        setIsLoadingCenters(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (selectedWilaya?.id) {
      fetchCenters(selectedWilaya.id);
    }
  }, [fetchCenters, selectedWilaya?.id]);

  const handleFieldChange = (e) => {
    const { name: fieldName, value } = e.target;
    if (fieldName === "name") setName(value);
    if (fieldName === "email") setEmail(value);
    if (fieldName === "review") setReview(value);
  };

  const handleBuyNow = () => {
    if (isDisabled) {
      toast.error(t("selectVariant", { variant: missingVariants.join(", ") }));
      return;
    }
    setQuantity(Math.max(quantity, 1));
    setIsModalOpen(true);
  };

  const handleAddToCartClick = () => {
    const id_user = status === "authenticated" ? session?.user?._id : getOrCreateUniqueId();
    handleAddToCart(id_user);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto  py-8 lg:py-12 pt-0 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
           <div className="sm:px-6 lg:px-8">
          <ProductGallery images={product.array_ProductImg} productTitle={product.title[locale] || product.title.fr} />

           </div>
          <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8">
            <ProductInfo product={product} currentPrice={currentPrice} locale={locale} />

            <VariantSelector
              product={product}
              selectedVariants={selectedVariants}
              selectedColorImage={selectedColorImage}
              onVariantSelect={handleVariantSelect}
              onColorSelect={handleColorSelect}
              locale={locale}
            />

            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <QuantitySelector quantity={quantity} onChange={setQuantity} />
            </div>

            <AddToCartActions
              onAddToCart={handleAddToCartClick}
              onBuyNow={handleBuyNow}
              isLoading={isLoading}
              disabled={isDisabled}
              currentPrice={currentPrice}
            />

            {isDisabled && (
              <p className="text-sm text-red-500 text-center">
                {t("selectVariant", { variant: missingVariants.join(", ") })}
              </p>
            )}
          </div>
        </div>



        <div className="px-4 sm:px-6 lg:px-8">
<CustomerReviews
          comments={comments}
          productTitle={product.title[locale] || product.title.fr}
          rating={rating}
          review={review}
          name={name}
          email={email}
          onRatingChange={setRating}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmitReview}
          isSubmitting={isSubmittingReview}
        />
        </div>

          <div className="px-4 sm:px-6 lg:px-8">
        <RelatedProducts productId={product._id} currentProductCategory={product.category} />

        </div>
        

      </div>

      <OrderForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        onInputChange={handleInputChange}
        onSelectRelayPoint={handleRelaySelect}
        onQuantityChange={setQuantity}
        onSubmit={handleSendOrder}
        isLoading={isLoading}
        subtotal={subtotal}
        deliveryFees={deliveryFees}
        total={total}
        quantity={quantity}
        wilayasWithPrices={wilayasWithPrices}
        communes={communes}
        centers={centers}
        isLoadingCenters={isLoadingCenters}
      />
    </div>
  );
};

export default ProductDetail;
