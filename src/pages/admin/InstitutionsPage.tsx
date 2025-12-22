import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Institution } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const mockInstitutions: Institution[] = [
  { id: '1', name: 'ABC Engineering College', email: 'admin@abc.edu', aisheCode: 'AISHE001', createdAt: new Date() },
  { id: '2', name: 'XYZ University', email: 'admin@xyz.edu', aisheCode: 'AISHE002', createdAt: new Date() },
  { id: '3', name: 'Tech Institute', email: 'admin@tech.edu', aisheCode: 'AISHE003', createdAt: new Date() },
];

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>(mockInstitutions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    aisheCode: '',
    address: '',
    phone: '',
  });
  const { toast } = useToast();

  const columns = [
    { key: 'name', label: 'Institution Name' },
    { key: 'email', label: 'Email' },
    { key: 'aisheCode', label: 'AISHE Code' },
    {
      key: 'createdAt',
      label: 'Created',
      render: (item: Institution) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  const handleCreate = () => {
    setEditingInstitution(null);
    setFormData({ name: '', email: '', password: '', aisheCode: '', address: '', phone: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (institution: Institution) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      email: institution.email,
      password: '',
      aisheCode: institution.aisheCode,
      address: institution.address || '',
      phone: institution.phone || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (institution: Institution) => {
    setInstitutions(institutions.filter((i) => i.id !== institution.id));
    toast({
      title: 'Institution deleted',
      description: `${institution.name} has been removed.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingInstitution) {
      setInstitutions(
        institutions.map((i) =>
          i.id === editingInstitution.id
            ? { ...i, ...formData }
            : i
        )
      );
      toast({
        title: 'Institution updated',
        description: `${formData.name} has been updated.`,
      });
    } else {
      const newInstitution: Institution = {
        id: `inst-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        aisheCode: formData.aisheCode,
        address: formData.address,
        phone: formData.phone,
        createdAt: new Date(),
      };
      setInstitutions([...institutions, newInstitution]);
      toast({
        title: 'Institution created',
        description: `${formData.name} has been registered.`,
      });
    }

    setIsDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Institutions"
        description="Manage all registered institutions"
        action={{ label: 'Add Institution', onClick: handleCreate }}
      />

      <DataTable
        columns={columns}
        data={institutions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingInstitution ? 'Edit Institution' : 'Create Institution'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Institution Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter institution name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@institution.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingInstitution && '(leave blank to keep current)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                required={!editingInstitution}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aisheCode">AISHE Code</Label>
              <Input
                id="aisheCode"
                value={formData.aisheCode}
                onChange={(e) => setFormData({ ...formData, aisheCode: e.target.value })}
                placeholder="Enter AISHE code"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingInstitution ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
