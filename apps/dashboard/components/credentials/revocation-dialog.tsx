'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ShieldX } from 'lucide-react';

interface RevocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  agentId: string;
  onConfirm: (reason: string) => Promise<void>;
}

export function RevocationDialog({
  open,
  onOpenChange,
  agentName,
  agentId,
  onConfirm,
}: RevocationDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmValid = confirmText.toLowerCase() === 'revoke';

  const handleConfirm = async () => {
    if (!isConfirmValid) return;

    setLoading(true);
    setError(null);

    try {
      await onConfirm(reason || 'Revoked via dashboard');
      // Close dialog on success
      setConfirmText('');
      setReason('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revocation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!loading) {
      setConfirmText('');
      setReason('');
      setError(null);
      onOpenChange(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ShieldX className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Revoke Credential</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>
                You are about to revoke the credential for:
              </p>
              <div className="p-3 rounded-lg bg-muted">
                <div className="font-medium">{agentName}</div>
                <div className="text-xs font-mono text-muted-foreground mt-1">
                  {agentId}
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="flex gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                This action cannot be undone
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Once revoked, this credential will immediately stop working.
                Any services verifying this agent will reject it.
              </p>
            </div>
          </div>

          {/* Reason (optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Revocation reason (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Security concern, Agent decommissioned"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              This will be recorded in the audit log
            </p>
          </div>

          {/* Confirm by typing */}
          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-bold text-red-600">REVOKE</span> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type REVOKE"
              disabled={loading}
              className={
                confirmText.length > 0 && !isConfirmValid
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmValid || loading}
          >
            {loading ? 'Revoking...' : 'Revoke Credential'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
