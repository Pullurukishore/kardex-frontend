'use client';

import { useState } from 'react';
import { Pencil, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface ServicePerson {
  id: number;
  email: string;
  isActive: boolean;
}

interface ZoneServicePersonActionsProps {
  person: ServicePerson;
  onRefresh?: () => Promise<void>;
}

export function ZoneServicePersonActions({ person, onRefresh }: ZoneServicePersonActionsProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      // Use general delete endpoint (backend will handle zone restrictions)
      await apiClient.delete(`/service-persons/${person.id}`);

      toast({
        title: 'Success',
        description: 'Service person deleted successfully',
      });

      // Refresh the data instead of reloading the page
      if (onRefresh) {
        await onRefresh();
      } else {
        router.refresh(); // Fallback to router refresh if no callback provided
      }
    } catch (error: any) {
      console.error('Error deleting service person:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete service person',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/zone/service-persons/${person.id}`} className="flex items-center">
              <Eye className="mr-2 h-4 w-4 text-blue-500" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/zone/service-persons/${person.id}/edit`} className="flex items-center">
              <Pencil className="mr-2 h-4 w-4 text-green-500" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Person</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {person.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
