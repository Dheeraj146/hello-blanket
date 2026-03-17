import { motion } from "framer-motion";

const Index = () => {
  return (
    <main className="min-h-svh w-full flex items-center justify-center bg-background selection:bg-foreground selection:text-background">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 1.4,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.2,
        }}
        whileHover={{
          scale: 1.03,
          transition: { type: "spring", stiffness: 300, damping: 15 },
        }}
        className="text-[clamp(5rem,15vw,12rem)] font-medium tracking-[-0.04em] text-foreground antialiased cursor-default select-none"
        style={{ fontFamily: "'Schibsted Grotesk', sans-serif" }}
      >
        hi
      </motion.h1>
    </main>
  );
};

export default Index;
