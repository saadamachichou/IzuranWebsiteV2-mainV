import React from 'react';
import { SocialIcon } from 'react-social-icons';
import { useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      form.reset();
      toast({
        title: "Message sent successfully",
        description: "We'll get back to you as soon as possible.",
      });
    }, 1500);
  }

  return (
    <>
      <Helmet>
        <title>Contact - Izuran</title>
        <meta name="description" content="Get in touch with Izuran for collaborations, inquiries, or to share your creative vision." />
      </Helmet>
      
      <div className="bg-black min-h-screen">
        <div className="mt-32 pb-8 bg-gradient-to-b from-amber-500/10 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Contact Us</span>
              </h1>
              <p className="text-lg max-w-3xl mx-auto text-gray-300" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                Get in touch with us for collaborations, inquiries, or to share your creative vision.
              </p>
            </motion.div>
          </div>
        </div>

        <main className="py-8">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="glassmorphism p-8 rounded-lg border border-amber-500/20 hover:border-amber-500/40 glow-card"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-full bg-amber-500/10">
                    <Mail className="w-6 h-6 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-bold font-space text-amber-300">Send us a Message</h2>
                </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-amber-200/80">Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          {...form.register("name")}
                          className="bg-black/50 border-amber-500/20 text-amber-200/80 placeholder-amber-200/80 focus:border-amber-500/40"
                          style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                        />
                        {form.formState.errors.name && (
                          <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-amber-200/80">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Your email"
                          {...form.register("email")}
                          className="bg-black/50 border-amber-500/20 text-amber-200/80 placeholder-amber-200/80 focus:border-amber-500/40"
                          style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                        />
                        {form.formState.errors.email && (
                          <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-amber-200/80">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Message subject"
                        {...form.register("subject")}
                        className="bg-black/50 border-amber-500/20 text-amber-200/80 placeholder-amber-200/80 focus:border-amber-500/40"
                        style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                      />
                      {form.formState.errors.subject && (
                        <p className="text-red-400 text-sm">{form.formState.errors.subject.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-amber-200/80">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Your message"
                        {...form.register("message")}
                        className="min-h-[150px] bg-black/50 border-amber-500/20 text-amber-200/80 placeholder-amber-200/80 focus:border-amber-500/40"
                        style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                      />
                      {form.formState.errors.message && (
                        <p className="text-red-400 text-sm">{form.formState.errors.message.message}</p>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Send Message
                        </div>
                      )}
                    </Button>
                  </form>
                </Form>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glassmorphism p-8 rounded-lg border border-amber-500/20 hover:border-amber-500/40 glow-card"
              >
                <h2 className="text-2xl font-bold font-space mb-6 text-amber-300">Contact Information</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-amber-200/80 mb-4">Email</h3>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-amber-400" />
                        <a href="mailto:izuranrecords@gmail.com" className="text-amber-200/60 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                          izuranrecords@gmail.com
                        </a>
                      </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-amber-200/80 mb-4">Phone</h3>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-amber-400" />
                      <a href="tel:+212691534392" className="text-amber-200/60 hover:text-amber-400 transition-colors">
                        +212 691 534 392
                      </a>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-amber-200/80 mb-4">Social Media</h3>
                    <div className="flex items-center justify-center space-x-5">
                      <SocialIcon 
                        url="https://soundcloud.com/izuran" 
                        target="_blank"
                        rel="noopener noreferrer"
                        network="soundcloud"
                        style={{ height: 40, width: 40 }}
                        bgColor="#ff5500"
                        className="transform hover:scale-110 transition-transform duration-300 hover:shadow-lg hover:shadow-orange-500/20"
                      />
                      <a
                        href="https://izuran.bandcamp.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-[#629aa9] flex items-center justify-center hover:opacity-80 transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20"
                        aria-label="Izuran on Bandcamp"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="white"
                          className="w-6 h-6"
                          aria-hidden="true"
                        >
                          <path d="M0 18.75l7.437-13.5H24l-7.437 13.5H0z" />
                        </svg>
                      </a>
                      <SocialIcon 
                        url="https://open.spotify.com/artist/izuran" 
                        target="_blank"
                        rel="noopener noreferrer"
                        network="spotify"
                        style={{ height: 40, width: 40 }}
                        bgColor="#1DB954"
                        className="transform hover:scale-110 transition-transform duration-300 hover:shadow-lg hover:shadow-green-500/20"
                      />
                      <SocialIcon 
                        url="https://www.youtube.com/@izuran" 
                        target="_blank"
                        rel="noopener noreferrer"
                        network="youtube"
                        style={{ height: 40, width: 40 }}
                        className="transform hover:scale-110 transition-transform duration-300 hover:shadow-lg hover:shadow-red-500/20"
                      />
                      <SocialIcon 
                        url="https://www.facebook.com/izuran" 
                        target="_blank"
                        rel="noopener noreferrer"
                        network="facebook"
                        style={{ height: 40, width: 40 }}
                        className="transform hover:scale-110 transition-transform duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                      />
                      <SocialIcon 
                        url="mailto:izuranrecords@gmail.com" 
                        target="_blank"
                        rel="noopener noreferrer"
                        network="email"
                        style={{ height: 40, width: 40 }}
                        bgColor="#EA4335"
                        className="transform hover:scale-110 transition-transform duration-300 hover:shadow-lg hover:shadow-red-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-amber-200/80 mb-4">Location</h3>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-black bg-opacity-30 border border-amber-500/20">
                      <div className="p-2 rounded-full bg-amber-500/10">
                        <MapPin className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-amber-200/80" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Based in Morocco</p>
                        <div className="pl-4 space-y-1">
                          <p className="text-amber-200/60" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>• Rabat</p>
                          <p className="text-amber-200/60" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>• Casablanca</p>
                          <p className="text-amber-200/60" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>• Working globally</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
