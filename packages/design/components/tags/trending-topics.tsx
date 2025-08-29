"use client";

import { Tags, TagsInput, TagsItem } from "./index";
import { TrendingUp } from "lucide-react";

interface TrendingTopicsProps {
  topics: string[];
  onSelectTopic: (topic: string) => void;
}

export function TrendingTopics({ topics, onSelectTopic }: TrendingTopicsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="w-4 h-4" />
        <span>Trending topics</span>
      </div>
      
      <Tags className="max-w-full">
        <TagsInput className="w-full">
          {topics.map((topic, index) => (
            <TagsItem 
              key={index} 
              value={topic}
              onClick={() => onSelectTopic(topic)}
              className="cursor-pointer hover:bg-accent transition-colors"
            >
              {topic}
            </TagsItem>
          ))}
        </TagsInput>
      </Tags>
    </div>
  );
}