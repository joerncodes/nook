"use client";

import { useEffect, useState } from "react";
import { GREETINGS, type Greeting } from "@/lib/greetings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function randomGreeting(): Greeting {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export function GreetingWidget({ name }: { name?: string }) {
  const [greeting, setGreeting] = useState<Greeting | null>(null);

  useEffect(() => {
    setGreeting(randomGreeting());
  }, []);

  if (!greeting) {
    return <div className="h-12">&nbsp;</div>;
  }

  const first = greeting.text.slice(0, 1);
  const rest = greeting.text.slice(1);

  return (
    <TooltipProvider delay={150}>
      <div className="greeting-widget">
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                className="greeting-word cursor-help"
                onClick={() => setGreeting(randomGreeting())}
              />
            }
          >
            <span className="greeting-dropcap">{first}</span>
            <span className="greeting-rest">{rest}</span>
          </TooltipTrigger>
          <TooltipContent>
            This is {greeting.language} for &ldquo;{greeting.meaning}&rdquo;
          </TooltipContent>
        </Tooltip>
        {name && <span className="greeting-name">, {name}</span>}
      </div>
    </TooltipProvider>
  );
}
