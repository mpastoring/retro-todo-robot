
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface TaskInputProps {
  onSubmit: (task: string) => Promise<void>;
  isLoading: boolean;
}

const TaskInput = ({ onSubmit, isLoading }: TaskInputProps) => {
  const [task, setTask] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) {
      toast({
        title: "Task required",
        description: "Please enter a task to break down.",
        variant: "destructive",
      });
      return;
    }
    await onSubmit(task);
    setTask('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      <div className="flex items-center space-x-2">
        <Terminal className="w-5 h-5 text-purple-500" />
        <Input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter your main task..."
          className="font-mono bg-white/50 border-purple-200"
          disabled={isLoading}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-purple-500 hover:bg-purple-600 font-mono"
        disabled={isLoading}
      >
        {isLoading ? "Breaking down task..." : "Generate Subtasks"}
      </Button>
    </form>
  );
};

export default TaskInput;
