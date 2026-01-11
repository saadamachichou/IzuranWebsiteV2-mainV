import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail("");
      toast({
        title: "Subscription successful",
        description: "Thank you for joining our cosmic transmission!",
      });
    }, 1000);
  };

  return (
    <section className="py-16 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="glassmorphism rounded-2xl p-8 md:p-12 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 z-0 opacity-30">
            <motion.div 
              className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-500 blur-3xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-amber-600 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", delay: 2 }}
            />
          </div>
          
          <div className="relative z-10">
            <motion.h2 
              className="text-3xl font-bold mb-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Join Our Cosmic Transmission</span>
            </motion.h2>
            
            <motion.p 
              className="text-gray-300 text-center mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
            >
              Subscribe to receive updates on upcoming events, new releases, and esoteric knowledge from the Izuran collective.
            </motion.p>
            
            <motion.form 
              className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleSubmit}
            >
              <input 
                type="email" 
                placeholder="Your email address" 
                className="newsletter-input flex-1 px-5 py-3 bg-black bg-opacity-50 border border-amber-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-3 bg-amber-600 text-black font-medium rounded-md hover:bg-amber-700 transition-all disabled:opacity-70"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </motion.form>
            
            <motion.p 
              className="text-gray-500 text-xs text-center mt-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
            >
              By subscribing, you agree to receive emails from Izuran. You can unsubscribe at any time.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
