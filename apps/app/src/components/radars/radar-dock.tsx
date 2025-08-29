"use client";

import { useState } from "react";
import { Lightning, ArrowsClockwise, Download, Share, Gear } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { toast } from "@repo/design/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WorkflowTriggerButton } from "./workflow-trigger-button";

interface RadarDockProps {
  radarId: string;
  radarQuery: string;
  radarDescription?: string;
  className?: string;
}

export function RadarDock({
  radarId,
  radarQuery,
  radarDescription,
  className,
}: RadarDockProps) {
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    {
      label: "instant ping",
      icon: <Lightning weight="duotone" className="h-4 w-4" />,
      component: (
        <WorkflowTriggerButton
          workflowId="generatePing"
          inputData={{
            radarId,
            userId: "", // Will be filled by the API
            timeframe: "weekly",
          }}
          buttonText="instant ping"
          buttonVariant="ghost"
          className="w-full justify-start px-3 py-2 text-sm h-auto hover:bg-muted/50 font-normal rounded-[10px]"
        />
      ),
    },
    {
      label: "analyze trends",
      icon: <ArrowsClockwise weight="duotone" className="h-4 w-4" />,
      component: (
        <WorkflowTriggerButton
          workflowId="analyzeTrends"
          inputData={{
            radarId,
            timeframe: "week",
          }}
          buttonText="analyze trends"
          buttonVariant="ghost"
          className="w-full justify-start px-3 py-2 text-sm h-auto hover:bg-muted/50 font-normal rounded-[10px]"
        />
      ),
    },
    {
      label: "export data",
      icon: <Download weight="duotone" className="h-4 w-4" />,
      onClick: () => {
        toast.info("export feature coming soon!");
      },
    },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className={cn(
          "bg-background/95 backdrop-blur-sm border border-border rounded-xl",
          "w-[280px] relative overflow-hidden"
        )}
        initial={false}
        animate={{
          height: isHovered ? 166 : 48,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
      >
        {/* Menu items - positioned from bottom to stay fixed */}
        <div className="absolute bottom-[48px] left-0 right-0 px-1">
          <div className="flex flex-col space-y-0.5">
            {menuItems.map((item, index) => (
              <div>
                {item.component ? (
                  item.component
                ) : (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 w-full",
                      "hover:bg-muted/50 rounded-[10px] transition-colors",
                      "text-sm text-foreground font-normal text-left"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom dock content - always visible */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-[48px] px-2",
          "flex items-center justify-between"
        )}>
          {/* Share button - left aligned */}
          <button
            onClick={() => {
              const currentUrl = window.location.href;
              navigator.clipboard.writeText(currentUrl);
              toast.success("radar link copied!");
            }}
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              "hover:bg-muted/50 transition-colors duration-300",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label="share radar"
          >
            <Share weight="duotone" className="h-4 w-4" />
          </button>

          {/* Settings button - right aligned */}
          <button
            onClick={() => {
              toast.info("settings coming soon!");
            }}
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              "hover:bg-muted/50 transition-colors duration-300",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label="radar settings"
          >
            <Gear weight="duotone" className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}