import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnrollmentRequest } from '@/types';
import { User, BookOpen, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const mockRequests: EnrollmentRequest[] = [
  {
    id: 'req1',
    studentId: 'stu1',
    studentName: 'Michael Brown',
    studentEmail: 'michael@student.com',
    studentRegNo: 'STU004',
    courseId: 'c3',
    courseName: 'Mobile App Development',
    status: 'pending',
    requestedAt: new Date('2024-01-15'),
  },
  {
    id: 'req2',
    studentId: 'stu2',
    studentName: 'Emily Davis',
    studentEmail: 'emily@student.com',
    studentRegNo: 'STU005',
    courseId: 'c4',
    courseName: 'Cloud Computing Essentials',
    status: 'pending',
    requestedAt: new Date('2024-01-14'),
  },
  {
    id: 'req3',
    studentId: 'stu3',
    studentName: 'David Wilson',
    studentEmail: 'david@student.com',
    studentRegNo: 'STU006',
    courseId: 'c5',
    courseName: 'Cybersecurity Fundamentals',
    status: 'pending',
    requestedAt: new Date('2024-01-13'),
  },
  {
    id: 'req4',
    studentId: 'stu4',
    studentName: 'Sarah Miller',
    studentEmail: 'sarah@student.com',
    studentRegNo: 'STU007',
    courseId: 'c3',
    courseName: 'Mobile App Development',
    status: 'approved',
    requestedAt: new Date('2024-01-10'),
    processedAt: new Date('2024-01-11'),
  },
  {
    id: 'req5',
    studentId: 'stu5',
    studentName: 'James Taylor',
    studentEmail: 'james@student.com',
    studentRegNo: 'STU008',
    courseId: 'c6',
    courseName: 'AI and Machine Learning',
    status: 'rejected',
    requestedAt: new Date('2024-01-08'),
    processedAt: new Date('2024-01-09'),
  },
];

export default function EnrollmentRequestsPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>(mockRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    setRequests(
      requests.map((r) =>
        r.id === requestId
          ? { ...r, status: 'approved' as const, processedAt: new Date() }
          : r
      )
    );
    
    const request = requests.find((r) => r.id === requestId);
    toast({
      title: 'Enrollment Approved',
      description: `${request?.studentName} has been enrolled in ${request?.courseName}.`,
    });
    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    setRequests(
      requests.map((r) =>
        r.id === requestId
          ? { ...r, status: 'rejected' as const, processedAt: new Date() }
          : r
      )
    );
    
    const request = requests.find((r) => r.id === requestId);
    toast({
      title: 'Enrollment Rejected',
      description: `${request?.studentName}'s request for ${request?.courseName} has been rejected.`,
      variant: 'destructive',
    });
    setProcessingId(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const RequestCard = ({ request }: { request: EnrollmentRequest }) => (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{request.studentName}</h3>
              <Badge variant="outline" className="text-xs">
                {request.studentRegNo}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{request.studentEmail}</p>
            <div className="flex items-center gap-2 mt-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{request.courseName}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requested on {formatDate(request.requestedAt)}
              {request.processedAt && ` • Processed on ${formatDate(request.processedAt)}`}
            </p>
          </div>

          {request.status === 'pending' && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleReject(request.id)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(request.id)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          )}

          {request.status === 'approved' && (
            <Badge className="bg-success/10 text-success border-success/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          )}

          {request.status === 'rejected' && (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              Rejected
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Enrollment Requests"
        description="Manage student enrollment requests for courses"
      />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <EmptyState message="No pending enrollment requests" />
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.length > 0 ? (
            approvedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <EmptyState message="No approved requests yet" />
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedRequests.length > 0 ? (
            rejectedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <EmptyState message="No rejected requests" />
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
