
import React, { useState, useEffect } from 'react';
import TaskInput from '@/components/TaskInput';
import SubtaskList from '@/components/SubtaskList';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      const { data, error } = await supabase.functions.invoke('generate-subtasks', {
        body: { task }
      });

      if (error) throw error;
      
      const newSubtasks = data.subtasks.map((text: string) => ({
        id: crypto.randomUUID(),
        text,
        completed: false,
      }));
      
      setSubtasks(newSubtasks);
    } catch (error) {
      console.error('Error generating subtasks:', error);
      toast({
        title: "Error",
        description: "Failed to generate subtasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubtask = async (id: string) => {
    setSubtasks(prev =>
      prev.map(subtask =>
        subtask.id === id
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      )
    );

    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed: !subtasks.find(s => s.id === id)?.completed })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast({
        title: "Error",
        description: "Failed to update subtask status.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchLatestSubtasks = async () => {
      try {
        const { data: latestTask, error: taskError } = await supabase
          .from('tasks')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (taskError) throw taskError;

        const { data: subtasksData, error: subtasksError } = await supabase
          .from('subtasks')
          .select('*')
          .eq('task_id', latestTask.id);

        if (subtasksError) throw subtasksError;

        setSubtasks(subtasksData.map(st => ({
          id: st.id,
          text: st.text,
          completed: st.completed,
        })));
      } catch (error) {
        console.error('Error fetching subtasks:', error);
      }
    };

    fetchLatestSubtasks();
  }, []);

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
