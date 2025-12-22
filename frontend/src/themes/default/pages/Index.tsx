import { PageProps } from '@/core/engine/types';

const Index: React.FC<PageProps> = ({ className }) => {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-background ${className || ''}`}>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

export default Index;