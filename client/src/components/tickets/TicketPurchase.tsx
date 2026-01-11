import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface TicketLimit {
  id: number;
  eventId: number;
  ticketType: 'early_bird' | 'second_phase' | 'last_phase' | 'vip';
  maxTickets: number;
  soldTickets: number;
  price: string;
  currency: string;
  isActive: boolean;
}

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  imageUrl: string;
}

export default function TicketPurchase() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const eventId = params?.eventId;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [availableTickets, setAvailableTickets] = useState<TicketLimit[]>([]);
  const [selectedTicketType, setSelectedTicketType] = useState<string>('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadEventAndTickets();
    }
  }, [eventId]);

  const loadEventAndTickets = async () => {
    try {
      setIsLoadingEvent(true);
      
      // Load event details
      const eventResponse = await api.get(`/events/${eventId}`);
      setEvent(eventResponse.data);

      // Load available tickets
      const ticketsResponse = await api.get(`/events/${eventId}/tickets`);
      setAvailableTickets(ticketsResponse.data);
      
      // Set default ticket type if available
      if (ticketsResponse.data.length > 0) {
        setSelectedTicketType(ticketsResponse.data[0].ticketType);
      }
    } catch (error) {
      console.error('Error loading event and tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEvent(false);
    }
  };

  const getSelectedTicket = () => {
    return availableTickets.find(ticket => ticket.ticketType === selectedTicketType);
  };

  const getAvailableCount = (ticketType: string) => {
    const ticket = availableTickets.find(t => t.ticketType === ticketType);
    return ticket ? ticket.maxTickets - ticket.soldTickets : 0;
  };

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase tickets",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTicketType || !attendeeName || !attendeeEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const selectedTicket = getSelectedTicket();
    if (!selectedTicket || getAvailableCount(selectedTicketType) <= 0) {
      toast({
        title: "No Tickets Available",
        description: "This ticket type is sold out",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await api.post('/tickets/purchase', {
        eventId: parseInt(eventId!),
        ticketType: selectedTicketType,
        attendeeName,
        attendeeEmail,
        attendeePhone,
        paymentMethod
      });

      toast({
        title: "Success!",
        description: "Ticket purchased successfully. Check your email for the QR code.",
      });

      // Redirect to confirmation page or user's tickets
      setLocation('/tickets/my-tickets');
    } catch (error: any) {
      console.error('Error purchasing ticket:', error);
      toast({
        title: "Purchase Failed",
        description: error.response?.data?.message || "Failed to purchase ticket",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Event not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Purchase Tickets</CardTitle>
            <CardDescription>
              {event.name} - {new Date(event.date).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Event Details</h3>
              <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Description:</strong> {event.description}</p>
            </div>

            {/* Ticket Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="ticketType">Ticket Type</Label>
              <Select value={selectedTicketType} onValueChange={setSelectedTicketType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTickets.map((ticket) => (
                    <SelectItem 
                      key={ticket.ticketType} 
                      value={ticket.ticketType}
                      disabled={getAvailableCount(ticket.ticketType) <= 0}
                    >
                      {ticket.ticketType.replace('_', ' ').toUpperCase()} - {ticket.price} {ticket.currency} 
                      ({getAvailableCount(ticket.ticketType)} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Attendee Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Attendee Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="attendeeName">Full Name *</Label>
                <Input
                  id="attendeeName"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="Enter attendee's full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendeeEmail">Email *</Label>
                <Input
                  id="attendeeEmail"
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="Enter attendee's email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendeePhone">Phone Number</Label>
                <Input
                  id="attendeePhone"
                  type="tel"
                  value={attendeePhone}
                  onChange={(e) => setAttendeePhone(e.target.value)}
                  placeholder="Enter attendee's phone number"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Summary */}
            {getSelectedTicket() && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Price Summary</h3>
                <p><strong>Ticket Type:</strong> {getSelectedTicket()?.ticketType.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Price:</strong> {getSelectedTicket()?.price} {getSelectedTicket()?.currency}</p>
                <p><strong>Available:</strong> {getAvailableCount(selectedTicketType)} tickets</p>
              </div>
            )}

            {/* Purchase Button */}
            <Button 
              onClick={handlePurchase} 
              disabled={isLoading || !selectedTicketType || !attendeeName || !attendeeEmail}
              className="w-full"
            >
              {isLoading ? 'Processing...' : `Purchase Ticket - ${getSelectedTicket()?.price} ${getSelectedTicket()?.currency}`}
            </Button>

            <p className="text-sm text-gray-500 text-center">
              By purchasing this ticket, you agree to our terms and conditions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 