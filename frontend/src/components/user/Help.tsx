import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Mail, Phone, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function Help() {
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Your message has been sent! We will get back to you soon.');
    setFormData({ subject: '', message: '' });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-1">Get in touch with us for any assistance</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-sm text-gray-600 mt-1">support@wheelonroad.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-sm text-gray-600 mt-1">+1 (555) 123-4567</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Live Chat</h3>
                <p className="text-sm text-gray-600 mt-1">Available 24/7</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send us a message</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="What is this about?"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Please describe your issue or question..."
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>
            <Button type="submit">
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
