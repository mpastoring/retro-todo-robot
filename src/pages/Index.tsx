
import React, { useState, useEffect } from 'react';
import TaskInput from '@/components/TaskInput';
import SubtaskList from '@/components/SubtaskList';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Rotate } from "lucide-react";

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentTask, setCurrentTask] = useState<string>("");
  const { toast } = useToast();

  const generateSubtasks = async (task: string) => {
    setIsLoading(true);
    setCurrentTask(task);
    try {
      const { data, error } = await supabase.functions.invoke('generate-subtasks', {
        body: { task }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }
      
      if (!data?.subtasks) {
        throw new Error('No subtasks returned from the function');
      }

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

  const resetAll = () => {
    setSubtasks([]);
    setCurrentTask("");
    toast({
      title: "Reset successful",
      description: "All tasks have been cleared.",
    });
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
          .select('id, title')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (taskError) throw taskError;
        
        if (!latestTask) {
          setSubtasks([]);
          return;
        }

        setCurrentTask(latestTask.title);

        const { data: subtasksData, error: subtasksError } = await supabase
          .from('subtasks')
          .select('*')
          .eq('task_id', latestTask.id);

        if (subtasksError) throw subtasksError;

        setSubtasks((subtasksData || []).map(st => ({
          id: st.id,
          text: st.text,
          completed: st.completed || false,
        })));
      } catch (error) {
        console.error('Error fetching subtasks:', error);
        toast({
          title: "Error",
          description: "Failed to fetch existing tasks.",
          variant: "destructive",
        });
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
        
        {currentTask && (
          <div className="mt-8 mb-4">
            <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
              <h2 className="font-mono text-lg font-semibold text-purple-800 mb-2">Current Task:</h2>
              <p className="font-mono text-purple-600">{currentTask}</p>
            </div>
          </div>
        )}

        <SubtaskList subtasks={subtasks} onToggle={toggleSubtask} />

        {(currentTask || subtasks.length > 0) && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={resetAll}
              variant="outline"
              className="font-mono text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Rotate className="w-4 h-4 mr-2" />
              Reset All
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
