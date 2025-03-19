import Image from "next/image";
import AutomationPanel from '@/components/AutomationPanel';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 sm:p-12">
      <div className="w-full max-w-5xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-primary dark:text-blue-400">ShitPoster4</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Powerful desktop automation with Playwright
          </p>
        </header>
        
        <AutomationPanel />
        
        <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>
            Use this tool to automate browser and desktop interactions. 
            Be responsible and comply with website terms of service.
          </p>
        </footer>
      </div>
    </main>
  );
}
