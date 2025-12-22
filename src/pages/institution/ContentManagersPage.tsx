import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { ContentManager } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const mockContentManagers: ContentManager[] = [
  { id: '1', name: 'John Smith', email: 'john@teacher.com', employeeId: 'EMP001', institutionId: 'inst-1', courseIds: ['c1', 'c2'] },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@teacher.com', employeeId: 'EMP002', institutionId: 'inst-1', courseIds: ['c2', 'c3'] },
  { id: '3', name: 'Mike Wilson', email: 'mike@teacher.com', employeeId: 'EMP003', institutionId: 'inst-1', courseIds: ['c1'] },
];

export default function ContentManagersPage() {
  const [managers, setManagers] = useState<ContentManager[]>(mockContentManagers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ContentManager | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
  });
  const { toast } = useToast();

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'employeeId', label: 'Employee ID' },
    {
      key: 'courseIds',
      label: 'Courses',
      render: (item: ContentManager) => (
        <Badge variant="secondary">{item.courseIds.length} courses</Badge>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingManager(null);
    setFormData({ name: '', email: '', password: '', employeeId: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (manager: ContentManager) => {
    setEditingManager(manager);
    setFormData({
      name: manager.name,
      email: manager.email,
      password: '',
      employeeId: manager.employeeId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (manager: ContentManager) => {
    setManagers(managers.filter((m) => m.id !== manager.id));
    toast({
      title: 'Content Manager deleted',
      description: `${manager.name} has been removed.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingManager) {
      setManagers(
        managers.map((m) =>
          m.id === editingManager.id
            ? { ...m, ...formData }
            : m
        )
      );
      toast({
        title: 'Content Manager updated',
        description: `${formData.name} has been updated.`,
      });
    } else {
      const newManager: ContentManager = {
        id: `cm-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        employeeId: formData.employeeId,
        institutionId: 'inst-1',
        courseIds: [],
      };
      setManagers([...managers, newManager]);
      toast({
        title: 'Content Manager created',
        description: `${formData.name} has been added.`,
      });
    }

    setIsDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Content Managers"
        description="Manage content managers for your institution"
        action={{ label: 'Add Content Manager', onClick: handleCreate }}
      />

      <DataTable
        columns={columns}
        data={managers}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingManager ? 'Edit Content Manager' : 'Add Content Manager'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
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
                placeholder="teacher@teacher.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingManager && '(leave blank to keep current)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                required={!editingManager}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="Enter employee ID"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingManager ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
