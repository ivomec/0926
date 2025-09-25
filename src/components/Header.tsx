
import { Home, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

// Custom SVG Tooth Icon Component
const ToothIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9.34 2.4a2.5 2.5 0 0 1 5.32 0l.22 1.32a9.14 9.14 0 0 1 3.56 2.54l1.12-.82a2.5 2.5 0 0 1 3.2 3.22l-.82 1.12a9.14 9.14 0 0 1 0 7.08l.82 1.12a2.5 2.5 0 0 1-3.2 3.22l-1.12-.82a9.14 9.14 0 0 1-3.56 2.54l-.22 1.32a2.5 2.5 0 0 1-5.32 0l-.22-1.32a9.14 9.14 0 0 1-3.56-2.54l-1.12.82a2.5 2.5 0 0 1-3.2-3.22l.82-1.12a9.14 9.14 0 0 1 0-7.08l-.82-1.12a2.5 2.5 0 0 1 3.2-3.22l1.12.82a9.14 9.14 0 0 1 3.56-2.54Z" />
    <path d="M9.5 12c.83 0 1.5.67 1.5 1.5S10.33 15 9.5 15s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5Z" />
    <path d="M14.5 12c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5Z" />
  </svg>
);


export function Header({ isLoggedIn, onLogout }: { isLoggedIn: boolean, onLogout: () => void }) {
  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg md:text-xl"
        >
          <ToothIcon className="h-6 w-6 text-primary" data-ai-hint="tooth logo"/>
          <h1>금호동물병원 치과 챠트 (개발용)</h1>
        </Link>
        {isLoggedIn && (
           <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
                <Link href="/">
                    <Home />
                    <span className="sr-only">홈</span>
                </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut />
              <span className="sr-only">로그아웃</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
