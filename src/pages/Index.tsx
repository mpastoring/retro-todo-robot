
import React, { useState } from 'react';
import TaskInput from '@/components/TaskInput';
import SubtaskList from '@/components/SubtaskList';
import { useToast } from "@/components/ui/use-toast";

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const { toast } = useToast();

  const generateSubtasks = async (task: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });

      if (!response.ok) throw new Error('Failed to generate subtasks');
      
      const data = await response.json();
      const newSubtasks = data.subtasks.map((text: string) => ({
        id: crypto.randomUUID(),
        text,
        completed: false,
      }));
      
      setSubtasks(newSubtasks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate subtasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(prev =>
      prev.map(subtask =>
        subtask.id === id
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-green-50 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="font-mono text-3xl font-bold mb-2 text-purple-800">
            Retro Task AI
          </h1>
          <p className="font-mono text-sm text-purple-600">
            Let AI break down your tasks into manageable steps
          </p>
        </header>

        <TaskInput onSubmit={generateSubtasks} isLoading={isLoading} />
        <SubtaskList subtasks={subtasks} onToggle={toggleSubtask} />
      </div>
    </div>
  );
};

export default Index;
