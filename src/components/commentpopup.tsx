"use client"
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./ui/button";

interface CommentPopupProps {
  onSave: (comment: string) => void;
  triggerButton: React.ReactElement;
}

const CommentPopup: React.FC<CommentPopupProps> = ({ onSave, triggerButton }) => {
  const [comment, setComment] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setComment('');
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  const handleSave = () => {
    onSave(comment);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton && React.cloneElement(triggerButton, { onClick: handleOpen })}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Comment</DialogTitle>
        </DialogHeader>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Type your comment here..."
        />
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="secondary" onClick={handleSave} className="ml-2">Submit Comment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentPopup;
