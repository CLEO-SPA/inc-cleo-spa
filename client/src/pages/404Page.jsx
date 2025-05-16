import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-background p-4'>
      <Card className='w-full max-w-md text-center'>
        <CardHeader>
          <div className='flex justify-center mb-4'>
            <AlertTriangle className='h-16 w-16 text-destructive' />
          </div>
          <CardTitle className='text-3xl font-bold'>404 - Page Not Found</CardTitle>
          <CardDescription className='text-muted-foreground mt-2'>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex justify-center gap-4 mt-6'>
            <Button variant='outline' onClick={goBack}>
              <ArrowLeft className='mr-2 h-4 w-4' /> Go Back
            </Button>
            <Button onClick={goHome}>
              <Home className='mr-2 h-4 w-4' /> Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundPage;
