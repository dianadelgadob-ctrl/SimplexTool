import { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { toast } from "sonner@2.0.3";

export function FeedbackDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackType || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create feedback object
      const feedback = {
        type: feedbackType,
        message: message.trim(),
        userEmail: email.trim() || "Not provided",
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      // Format email content
      const emailSubject = `Simplex Calculator Feedback: ${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)}`;
      const emailBody = `
Feedback Type: ${feedbackType.toUpperCase()}

User Email: ${feedback.userEmail}

Message:
${feedback.message}

---
Submitted: ${new Date().toLocaleString()}
User Agent: ${feedback.userAgent}
      `.trim();

      // Create mailto link
      const mailtoLink = `mailto:dhernan@udmercy.edu?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open email client
      window.location.href = mailtoLink;
      
      console.log("Feedback submitted:", feedback);
      
      toast.success("Opening email client...", {
        description: "Thank you for helping us improve!",
      });

      // Reset form after a short delay to allow email client to open
      setTimeout(() => {
        setFeedbackType("");
        setMessage("");
        setEmail("");
        setIsOpen(false);
      }, 1000);
    } catch (error) {
      toast.error("Failed to submit feedback", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 rounded-full shadow-lg hover:shadow-xl transition-all z-50 h-14 w-14 p-0"
            aria-label="Send feedback"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Help us improve by sharing your thoughts, reporting bugs, or
              suggesting new features.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">
                Feedback Type <span className="text-red-500">*</span>
              </Label>
              <Select value={feedbackType} onValueChange={setFeedbackType}>
                <SelectTrigger id="feedback-type">
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="feedback-message"
                placeholder="Tell us what's on your mind..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {message.length}/1000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-email">
                Email <span className="text-gray-500">(optional)</span>
              </Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                We'll only use this to follow up on your feedback
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !feedbackType || !message.trim()}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
