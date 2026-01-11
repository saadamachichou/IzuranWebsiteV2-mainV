import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Ticket {
  id: number;
  ticketId: string;
  eventId: number;
  userId: number;
  orderId: number;
  ticketType: 'early_bird' | 'second_phase' | 'last_phase' | 'vip';
  status: 'active' | 'used' | 'cancelled' | 'expired';
  price: string;
  currency: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  usedAt?: string;
  usedBy?: string;
  createdAt: string;
  event?: Event;
}

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  imageUrl: string;
}

export default function MyTickets() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tickets/my-tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load your tickets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async (ticket: Ticket) => {
    try {
      const response = await api.get(`/tickets/${ticket.ticketId}/qr-code`);
      setQrCodeDataUrl(response.data.qrCodeDataUrl);
      setSelectedTicket(ticket);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTicketTypeLabel = (type: string) => {
    return type.replace('_', ' ').toUpperCase();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Please log in to view your tickets</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
          <p className="text-gray-600">View and manage your event tickets</p>
        </div>

        {tickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't purchased any tickets yet.</p>
                <Button onClick={() => window.location.href = '/events'}>
                  Browse Events
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {ticket.event?.name || 'Event'}
                      </CardTitle>
                      <CardDescription>
                        {ticket.event?.date ? new Date(ticket.event.date).toLocaleDateString() : 'Date TBD'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {getTicketTypeLabel(ticket.ticketType)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Ticket Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Ticket ID:</strong> {ticket.ticketId}</p>
                          <p><strong>Attendee:</strong> {ticket.attendeeName}</p>
                          <p><strong>Email:</strong> {ticket.attendeeEmail}</p>
                          {ticket.attendeePhone && (
                            <p><strong>Phone:</strong> {ticket.attendeePhone}</p>
                          )}
                          <p><strong>Price:</strong> {ticket.price} {ticket.currency}</p>
                          <p><strong>Purchased:</strong> {new Date(ticket.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {ticket.event && (
                        <div>
                          <h4 className="font-semibold mb-2">Event Details</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Location:</strong> {ticket.event.location}</p>
                            <p><strong>Date:</strong> {new Date(ticket.event.date).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> {new Date(ticket.event.date).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      )}

                      {ticket.status === 'used' && ticket.usedAt && (
                        <div>
                          <h4 className="font-semibold mb-2">Usage Information</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Used At:</strong> {new Date(ticket.usedAt).toLocaleString()}</p>
                            {ticket.usedBy && (
                              <p><strong>Scanned By:</strong> {ticket.usedBy}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {ticket.status === 'active' && (
                        <div>
                          <h4 className="font-semibold mb-2">QR Code</h4>
                          <Button 
                            onClick={() => generateQRCode(ticket)}
                            className="w-full"
                          >
                            Show QR Code
                          </Button>
                        </div>
                      )}

                      {ticket.event?.imageUrl && (
                        <div>
                          <h4 className="font-semibold mb-2">Event Image</h4>
                          <img 
                            src={ticket.event.imageUrl} 
                            alt={ticket.event.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* QR Code Modal */}
        {qrCodeDataUrl && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">
                  QR Code for {selectedTicket.event?.name}
                </h3>
                <div className="bg-white p-4 rounded-lg border">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Show this QR code at the event entrance
                </p>
                <Button 
                  onClick={() => {
                    setQrCodeDataUrl(null);
                    setSelectedTicket(null);
                  }}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 