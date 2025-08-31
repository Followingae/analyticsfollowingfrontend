"use client";
import { useMotionValue } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useMotionTemplate, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const EvervaultCard = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState("");
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const generateDynamicString = () => {
      if (!containerRef) return generateRandomString(3000);
      
      const { width, height } = containerRef.getBoundingClientRect();
      // Calculate names needed based on container dimensions
      // 11px font, 14px line height, ~50px avg name width (7 chars * 7px)
      const namesPerLine = Math.floor((width - 8) / 50); // Account for padding, avg name width
      const linesNeeded = Math.ceil((height - 8) / 14); // Account for padding
      const totalNames = Math.floor(namesPerLine * linesNeeded * 2.5); // Increased density to fill the box
      
      console.log('Dynamic sizing:', { width, height, namesPerLine, linesNeeded, totalNames });
      
      return generateRandomString(Math.max(totalNames * 8, 2500)); // 8 chars per name avg (including spaces) - higher minimum
    };

    let str = generateDynamicString();
    setRandomString(str);

    // Regenerate on resize
    const handleResize = () => {
      setRandomString(generateDynamicString());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef]);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    let { left, top } = currentTarget.getBoundingClientRect();
    // Use clientX/Y which are relative to viewport, not affected by scroll
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);

    // Generate new text based on current container size
    const generateDynamicString = () => {
      if (!containerRef) return generateRandomString(3000);
      
      const { width, height } = containerRef.getBoundingClientRect();
      const namesPerLine = Math.floor(width / 50); // ~50px avg name width  
      const linesNeeded = Math.ceil(height / 14);
      const totalNames = Math.floor(namesPerLine * linesNeeded * 2.5); // Increased density to fill the box
      
      return generateRandomString(Math.max(totalNames * 8, 2000)); // 8 chars per name avg
    };

    const str = generateDynamicString();
    setRandomString(str);
  }

  return (
    <div
      ref={setContainerRef}
      className={cn(
        "bg-background w-full h-full relative overflow-hidden",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card w-full relative overflow-hidden bg-background h-full"
      >
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
        />
        {text && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative flex items-center justify-center">
              <span className="text-white font-bold text-6xl opacity-20">{text}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CardPattern = ({ mouseX, mouseY, randomString }: any) => {
  const maskImage = useMotionTemplate`radial-gradient(150px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };
  
  return (
    <div className="pointer-events-none">
      {/* Background names layer */}
      <div className="absolute inset-0 opacity-20 p-1">
        <div className="w-full h-full overflow-hidden">
          <p className="text-[11px] leading-[14px] break-all whitespace-pre-wrap text-muted-foreground/60 font-mono font-bold w-full h-full overflow-hidden">
            {randomString}
          </p>
        </div>
      </div>


      {/* Purple gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition duration-500"
        style={{
          background: 'radial-gradient(circle, rgba(81, 0, 243, 0.3) 0%, rgba(81, 0, 243, 0.1) 100%)',
          ...style
        }}
      />

      {/* Interactive names layer - no scaling */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition duration-500 p-1"
        style={style}
      >
        <div className="w-full h-full overflow-hidden">
          <p className="text-[11px] leading-[14px] break-all whitespace-pre-wrap font-mono font-bold w-full h-full overflow-hidden" style={{color: '#5100f3'}}>
            {randomString}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// Content categories, locations, influencers, and metrics for Smart Discovery animation
const contentCategories = [
  "Beauty", "Fashion", "Fitness", "Food", "Travel", "Tech", "Gaming", "Lifestyle", "Sports", "Music",
  "Art", "Photography", "Business", "Education", "Health", "Wellness", "Parenting", "Automotive",
  "Home Decor", "DIY", "Comedy", "Dance", "Skincare", "Makeup", "Luxury", "Shopping", "Reviews",
  "Finance", "Investment", "Motivation", "Self-Care", "Cooking", "Baking", "Vegan", "Organic"
];

const uaeLocations = [
  "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain",
  "Dubai Marina", "Downtown Dubai", "JBR", "Palm Jumeirah", "Dubai Mall", "Burj Khalifa",
  "Sheikh Zayed Road", "Business Bay", "DIFC", "Dubai Creek", "Al Ain", "Dubai Hills",
  "Arabian Ranches", "JLT", "Emirates Hills", "The Springs", "Motor City"
];

const saudiLocations = [
  "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Taif", "Tabuk", "Hail",
  "Abha", "Najran", "Jubail", "Yanbu", "King Abdulaziz City", "Qassim", "Al Kharj",
  "Red Sea", "NEOM", "AlUla", "Diriyah", "King Abdullah City", "Thuwal", "Hafr Al Batin"
];

const influencerUsernames = [
  "@sarah_dubai", "@ahmed_riyadh", "@fatima_lifestyle", "@omar_tech", "@layla_beauty",
  "@khalid_fitness", "@noor_fashion", "@yusuf_travel", "@amina_food", "@hassan_sports",
  "@zara_makeup", "@ali_gaming", "@maryam_wellness", "@abdulla_business", "@lina_art",
  "@mohammed_luxury", "@yasmin_health", "@tariq_finance", "@rana_cooking", "@saad_tech",
  "@hala_skincare", "@faisal_motivation", "@dina_photography", "@waleed_automotive",
  "@reem_dance", "@majid_comedy", "@laila_parenting", "@bashar_education", "@nada_diy",
  "@karim_investment", "@salma_organic", "@ibrahim_reviews", "@maya_vegan", "@sami_music",
  "@leena_homedecor", "@rashid_shopping", "@amal_selfcare", "@fahad_lifestyle", "@dana_baking",
  "@nawaf_luxury", "@ghada_wellness", "@adnan_business", "@sara_beauty", "@hamza_fitness",
  "@noura_fashion", "@salem_travel", "@laith_gaming", "@rania_health", "@talal_finance",
  "@aya_art", "@osama_sports", "@hind_makeup", "@badr_tech", "@widad_cooking",
  "@nasser_motivation", "@mona_skincare", "@jad_photography", "@lama_dance", "@rami_comedy",
  "@dima_parenting", "@mazen_automotive", "@ruba_education", "@fadi_diy", "@salam_organic",
  "@tala_reviews", "@zaid_investment", "@rim_vegan", "@anwar_music", "@leen_homedecor",
  "@marwan_shopping", "@haya_selfcare", "@qasim_lifestyle", "@rand_baking", "@habib_luxury",
  "@shada_wellness", "@raed_business", "@batool_beauty", "@muntasir_fitness", "@razan_fashion",
  "@mohannad_travel", "@sundus_gaming", "@yazed_health", "@shaima_finance", "@firas_art",
  "@bushra_sports", "@qays_makeup", "@tamara_tech", "@layth_cooking", "@duha_motivation",
  "@sinan_skincare", "@lara_photography", "@amjad_dance", "@hanin_comedy", "@maher_parenting",
  "@nour_automotive", "@farah_education", "@mutaz_diy", "@huda_organic", "@ghalib_reviews",
  "@raghad_investment", "@khalil_vegan", "@rula_music", "@nazir_homedecor", "@sana_shopping",
  "@bilal_selfcare", "@lujain_lifestyle", "@ghassan_baking", "@rawda_luxury", "@shadi_wellness",
  "@karam_business", "@dalal_beauty", "@musab_fitness", "@shahad_fashion", "@louay_travel",
  "@israa_gaming", "@wael_health", "@thara_finance", "@subhi_art", "@areen_sports",
  "@basel_makeup", "@layan_tech", "@gazi_cooking", "@nada_motivation", "@fares_skincare",
  "@maysa_photography", "@salam_dance", "@jihan_comedy", "@murad_parenting", "@sereen_automotive",
  "@emad_education", "@laith_diy", "@shireen_organic", "@raef_reviews", "@hadeel_investment",
  "@moataz_vegan", "@sahar_music", "@ameer_homedecor", "@lubna_shopping", "@suhail_selfcare",
  "@sawsan_lifestyle", "@riyad_baking", "@mayada_luxury", "@naseem_wellness", "@tareq_business",
  "@siham_beauty", "@jihad_fitness", "@sabah_fashion", "@mazen_travel", "@wijdan_gaming",
  "@naeem_health", "@dalia_finance", "@walid_art", "@ruwaida_sports", "@sameer_makeup",
  "@lamar_tech", "@hazem_cooking", "@zahida_motivation", "@fayez_skincare", "@mayar_photography",
  "@saif_dance", "@nayeli_comedy", "@mahdi_parenting", "@alia_automotive", "@maroun_education",
  "@kifah_diy", "@najwa_organic", "@ammar_reviews", "@najla_investment", "@munir_vegan",
  "@safaa_music", "@jamil_homedecor", "@intissar_shopping", "@samer_selfcare", "@kawther_lifestyle",
  "@nabil_baking", "@samiha_luxury", "@fawaz_wellness", "@kamil_business", "@nihad_beauty",
  "@motasem_fitness", "@najat_fashion", "@mohamad_travel", "@samar_gaming", "@shaker_health",
  "@lamya_finance", "@rafiq_art", "@widad_sports", "@siraj_makeup", "@wafa_tech",
  "@nasir_cooking", "@buthayna_motivation", "@mohsen_skincare", "@rima_photography", "@adham_dance"
];

const influencerMetrics = [
  "2.1M Followers", "4.2% Engagement", "850K Views", "95% Reach", "3.7% CTR", "1.8M Impressions",
  "650K Likes", "25K Comments", "180K Shares", "92% Completion Rate", "5.1% Engagement", "1.3M Followers",
  "720K Views", "88% Reach", "2.9% CTR", "2.2M Impressions", "420K Likes", "18K Comments",
  "95K Shares", "87% Completion Rate", "3.4% Engagement", "980K Followers", "450K Views",
  "93% Reach", "4.7% CTR", "1.6M Impressions", "320K Likes", "12K Comments", "65K Shares",
  "91% Completion Rate", "6.2% Engagement", "750K Followers", "380K Views", "89% Reach",
  "3.1% CTR", "1.9M Impressions", "280K Likes", "15K Comments", "48K Shares", "94% Completion Rate",
  "4.8% Engagement", "1.5M Followers", "690K Views", "96% Reach", "2.4% CTR", "2.5M Impressions",
  "510K Likes", "22K Comments", "125K Shares", "88% Completion Rate", "5.7% Engagement",
  "620K Followers", "340K Views", "85% Reach", "3.8% CTR", "1.4M Impressions", "190K Likes",
  "8K Comments", "35K Shares", "90% Completion Rate", "7.1% Engagement", "890K Followers",
  "520K Views", "92% Reach", "4.3% CTR", "2.1M Impressions", "365K Likes", "19K Comments",
  "88K Shares", "86% Completion Rate", "3.9% Engagement", "1.1M Followers", "475K Views",
  "94% Reach", "2.7% CTR", "1.7M Impressions", "240K Likes", "11K Comments", "52K Shares",
  "89% Completion Rate", "5.3% Engagement", "780K Followers", "395K Views", "87% Reach",
  "3.5% CTR", "1.8M Impressions", "285K Likes", "14K Comments", "67K Shares", "93% Completion Rate"
];

// Combined array with all influencer marketing elements
const influencerData = [
  ...contentCategories,
  ...uaeLocations,
  ...saudiLocations, 
  ...influencerUsernames,
  ...influencerMetrics
];

export const generateRandomString = (length: number) => {
  let result = "";
  const avgLength = 8; // Average length for influencer data elements
  const words = Math.ceil(length / avgLength);
  
  for (let i = 0; i < words; i++) {
    const element = influencerData[Math.floor(Math.random() * influencerData.length)];
    result += element;
    
    // Add space between elements, but not after the last one
    if (i < words - 1) {
      result += " ";
    }
  }
  
  return result.substring(0, length); // Trim to exact length if needed
};

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};