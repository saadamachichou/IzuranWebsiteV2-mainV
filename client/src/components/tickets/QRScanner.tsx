import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface ValidationResult {
  isValid: boolean;
  ticket?: {
    id: number;
    ticketId: string;
    attendeeName: string;
    attendeeEmail: string;
    ticketType: string;
    status: string;
    price: string;
    currency: string;
    usedAt?: string;
    usedBy?: string;
  };
  event?: {
    id: number;
    name: string;
    date: string;
    location: string;
  };
  message: string;
  status: 'valid' | 'invalid' | 'already_used' | 'expired' | 'not_found' | 'cancelled';
}

export default function QRScanner() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isMarkingUsed, setIsMarkingUsed] = useState(false);
  const [validatedBy, setValidatedBy] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Error",
        description: "Please allow camera access to scan QR codes",
        variant: "destructive"
      });
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQrCodeData(e.target.value);
  };

  const validateTicket = async () => {
    if (!qrCodeData.trim()) {
      toast({
        title: "QR Code Required",
        description: "Please enter or scan a QR code",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsValidating(true);
      const response = await api.post('/tickets/validate', {
        qrCodeData: qrCodeData.trim(),
        validatedBy: validatedBy || 'admin'
      });
      
      setValidationResult(response.data);
      
      if (response.data.isValid) {
        toast({
          title: "Valid Ticket",
          description: response.data.message,
        });
      } else {
        toast({
          title: "Invalid Ticket",
          description: response.data.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error validating ticket:', error);
      toast({
        title: "Validation Error",
        description: error.response?.data?.message || "Failed to validate ticket",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const markTicketAsUsed = async () => {
    if (!validationResult?.ticket) return;

    try {
      setIsMarkingUsed(true);
      const response = await api.post(`/tickets/${validationResult.ticket.ticketId}/use`, {
        usedBy: validatedBy || 'admin'
      });
      
      toast({
        title: "Success",
        description: "Ticket marked as used",
      });
      
      // Refresh validation result
      setValidationResult({
        ...validationResult,
        ticket: {
          ...validationResult.ticket,
          status: 'used',
          usedAt: new Date().toISOString(),
          usedBy: validatedBy || 'admin'
        }
      });
    } catch (error: any) {
      console.error('Error marking ticket as used:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to mark ticket as used",
        variant: "destructive"
      });
    } finally {
      setIsMarkingUsed(false);
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

  const resetForm = () => {
    setQrCodeData('');
    setValidationResult(null);
    setValidatedBy('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Ticket Check-in</CardTitle>
            <CardDescription>
              Scan or enter QR codes to validate tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scanner Name */}
            <div className="space-y-2">
              <Label htmlFor="validatedBy">Scanner Name</Label>
              <Input
                id="validatedBy"
                value={validatedBy}
                onChange={(e) => setValidatedBy(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            {/* QR Code Input */}
            <div className="space-y-2">
              <Label htmlFor="qrCodeData">QR Code Data</Label>
              <div className="flex gap-2">
                <Input
                  id="qrCodeData"
                  value={qrCodeData}
                  onChange={handleManualInput}
                  placeholder="Enter QR code data or scan"
                />
                <Button 
                  onClick={validateTicket}
                  disabled={isValidating || !qrCodeData.trim()}
                >
                  {isValidating ? 'Validating...' : 'Validate'}
                </Button>
              </div>
            </div>

            {/* Camera Scanner */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={startScanning}
                  disabled={isScanning}
                  variant="outline"
                >
                  Start Camera
                </Button>
                {isScanning && (
                  <Button 
                    onClick={stopScanning}
                    variant="outline"
                  >
                    Stop Camera
                  </Button>
                )}
              </div>

              {isScanning && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-black rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white rounded-lg w-48 h-48"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Result */}
            {validationResult && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {validationResult.isValid ? 'Valid Ticket' : 'Invalid Ticket'}
                      </CardTitle>
                      <CardDescription>
                        {validationResult.message}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(validationResult.ticket?.status || 'unknown')}>
                      {validationResult.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {validationResult.ticket && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Ticket Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Ticket ID:</strong> {validationResult.ticket.ticketId}</p>
                          <p><strong>Attendee:</strong> {validationResult.ticket.attendeeName}</p>
                          <p><strong>Email:</strong> {validationResult.ticket.attendeeEmail}</p>
                          <p><strong>Type:</strong> {validationResult.ticket.ticketType.replace('_', ' ').toUpperCase()}</p>
                          <p><strong>Price:</strong> {validationResult.ticket.price} {validationResult.ticket.currency}</p>
                          {validationResult.ticket.usedAt && (
                            <p><strong>Used At:</strong> {new Date(validationResult.ticket.usedAt).toLocaleString()}</p>
                          )}
                          {validationResult.ticket.usedBy && (
                            <p><strong>Scanned By:</strong> {validationResult.ticket.usedBy}</p>
                          )}
                        </div>
                      </div>

                      {validationResult.event && (
                        <div>
                          <h4 className="font-semibold mb-2">Event Details</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Event:</strong> {validationResult.event.name}</p>
                            <p><strong>Date:</strong> {new Date(validationResult.event.date).toLocaleDateString()}</p>
                            <p><strong>Location:</strong> {validationResult.event.location}</p>
                          </div>
                        </div>
                      )}

                      {validationResult.isValid && validationResult.ticket.status === 'active' && (
                        <div className="pt-4">
                          <Button 
                            onClick={markTicketAsUsed}
                            disabled={isMarkingUsed}
                            className="w-full"
                          >
                            {isMarkingUsed ? 'Marking as Used...' : 'Mark as Used'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reset Button */}
            {(validationResult || qrCodeData) && (
              <Button 
                onClick={resetForm}
                variant="outline"
                className="w-full"
              >
                Reset
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 