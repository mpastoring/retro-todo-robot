
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (id: string) => void;
}

const SubtaskList = ({ subtasks, onToggle }: SubtaskListProps) => {
  if (!subtasks.length) return null;

  return (
    <div className="space-y-3 w-full max-w-md mx-auto mt-8">
      {subtasks.map((subtask) => (
        <div
          key={subtask.id}
          className={cn(
            "flex items-start space-x-3 p-3 rounded-lg transition-all duration-300",
            "bg-white/50 border border-purple-100 hover:border-purple-200",
            "animate-fade-in"
          )}
        >
          <Checkbox
            checked={subtask.completed}
            onCheckedChange={() => onToggle(subtask.id)}
            className="mt-1"
          />
          <span className={cn(
            "font-mono text-sm",
            subtask.completed && "line-through text-gray-400"
          )}>
            {subtask.text}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SubtaskList;
