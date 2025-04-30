"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { logProgress, getTodayProgress } from "@/services/progress.service";
import {
  getUserTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "@/services/todo.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  List,
  Plus,
  Timer,
  X,
  Zap,
  Coffee,
  ChevronUp,
  Clock,
  ChevronDown,
  Info,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { updateLeaderboardPoints } from "@/services/leaderboard.service";

interface Todo {
  $id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  pointsAwarded?: boolean;
  isProcessing?: boolean;
}

interface ProgressActivity {
  id: string;
  type: "attendance" | "subject" | "todo" | "pomodoro";
  details: string;
  points: number;
  timestamp: string;
}

const motivationalQuotes = [
  "Focus on your goal. Every minute counts.",
  "Small steps every day lead to big achievements.",
  "Your future is created by what you do today.",
  "Stay focused. The reward is worth the effort.",
  "Deep work leads to deep understanding.",
  "Quality focus time builds quality results.",
  "You're investing in yourself right now.",
  "Progress is progress, no matter how small.",
  "The focused mind is the productive mind.",
  "Consistency is the key to mastery.",
];

export default function ProgressPage() {
  const { user, updateUserData } = useAuth();
  const router = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingProgress, setHasExistingProgress] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  console.log(earnedPoints, setCurrentDateTime);
  const [attendance, setAttendance] = useState(false);
  const [attendanceLocked, setAttendanceLocked] = useState(false);
  const [attendancePointsAwarded, setAttendancePointsAwarded] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectsPointsAwarded, setSubjectsPointsAwarded] = useState<{
    [key: string]: boolean;
  }>({});
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [currentTodoForPomodoro, setCurrentTodoForPomodoro] =
    useState<string>("none");
  const [progressActivities, setProgressActivities] = useState<
    ProgressActivity[]
  >([]);
  const [lastPomodoroPointsAwarded, setLastPomodoroPointsAwarded] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const [timerProgress, setTimerProgress] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const breakAudioRef = useRef<HTMLAudioElement | null>(null);

  const sscSubjects = [
    "English",
    "Hindi",
    "Marathi",
    "Sanskrit",
    "Science",
    "Maths",
    "Social Science",
    "Other",
  ];

  useEffect(() => {
    const initializeData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const todayProgress = await getTodayProgress(user.$id);
        if (todayProgress) {
          setHasExistingProgress(true);
          setAttendance(todayProgress.attendance ?? false);
          setAttendanceLocked(todayProgress.attendance ?? false);
          setAttendancePointsAwarded(todayProgress.attendance ?? false);

          const savedSubjects = todayProgress.subjects ?? [];
          setSubjects(savedSubjects);

          const subjectsPointsAwardedObj: { [key: string]: boolean } = {};
          savedSubjects.forEach((subject: string) => {
            subjectsPointsAwardedObj[subject] = true;
          });
          setSubjectsPointsAwarded(subjectsPointsAwardedObj);

          setPomodoroCount(todayProgress.pomodoroCount ?? 0);
          setLastPomodoroPointsAwarded(todayProgress.pomodoroCount ?? 0);

          if (todayProgress.activities) {
            setProgressActivities(todayProgress.activities);
          }
        } else {
          setHasExistingProgress(false);
          setAttendance(false);
          setAttendanceLocked(false);
          setAttendancePointsAwarded(false);
          setSubjects([]);
          setSubjectsPointsAwarded({});
          setPomodoroCount(0);
          setLastPomodoroPointsAwarded(0);
          setProgressActivities([]);
        }

        const userTodosData = await getUserTodos(user.$id);
        setTodos(
          userTodosData.map((doc) => ({
            $id: doc.$id,
            text: doc.text ?? "",
            completed: doc.completed ?? false,
            createdAt: doc.createdAt ?? new Date().toISOString(),
            pointsAwarded: doc.pointsAwarded ?? false,
          }))
        );
      } catch (error) {
        console.error("Error initializing data:", error);
        toast({
          title: "Error Loading Data",
          description:
            "Could not load your previous progress or todos. Please try refreshing.",
          variant: "destructive",
        });
        setHasExistingProgress(false);
        setAttendance(false);
        setAttendanceLocked(false);
        setAttendancePointsAwarded(false);
        setSubjects([]);
        setSubjectsPointsAwarded({});
        setPomodoroCount(0);
        setLastPomodoroPointsAwarded(0);
        setProgressActivities([]);
        setTodos([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!audioRef.current) {
      audioRef.current = new Audio("/notification.mp3");
    }
    if (!breakAudioRef.current) {
      breakAudioRef.current = new Audio("/break-notification.mp3");
    }

    setCurrentQuote(
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    );

    initializeData();
  }, [user]);

  useEffect(() => {
    if (isTimerActive && !isTimerPaused) {
      const totalTime = isBreak ? breakMinutes * 60 : focusMinutes * 60;

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (!isBreak && audioRef.current) {
              audioRef.current
                .play()
                .catch((e) =>
                  console.error("Error playing focus notification:", e)
                );
            } else if (isBreak && breakAudioRef.current) {
              breakAudioRef.current
                .play()
                .catch((e) =>
                  console.error("Error playing break notification:", e)
                );
            }

            toast({
              title: isBreak ? "Break Time Over!" : "Focus Session Completed!",
              description: isBreak
                ? "Time to get back to work. Starting a new focus session."
                : "Great job! Take a short break now.",
              variant: "default",
            });

            if (!isBreak) {
              setPomodoroCount((prevCount) => prevCount + 1);
              setIsBreak(true);
              setCurrentQuote(
                motivationalQuotes[
                  Math.floor(Math.random() * motivationalQuotes.length)
                ]
              );
              setTimeLeft(breakMinutes * 60);
              setTimerProgress(100);
              return breakMinutes * 60;
            } else {
              setIsBreak(false);
              setCurrentQuote(
                motivationalQuotes[
                  Math.floor(Math.random() * motivationalQuotes.length)
                ]
              );
              setTimeLeft(focusMinutes * 60);
              setTimerProgress(100);
              return focusMinutes * 60;
            }
          }

          const progressPercentage =
            totalTime > 0 ? ((prev - 1) / totalTime) * 100 : 0;
          setTimerProgress(progressPercentage);

          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, isTimerPaused, isBreak, focusMinutes, breakMinutes]);

  const handleAttendanceToggle = (checked: boolean | "indeterminate") => {
    const isChecked = typeof checked === "boolean" ? checked : false;

    if (attendanceLocked && !isChecked) {
      toast({
        title: "Cannot unmark attendance",
        description: "Once attendance is marked, it cannot be unmarked.",
        variant: "destructive",
      });
      return;
    }

    setAttendance(isChecked);
    if (isChecked) {
      setAttendanceLocked(true);
      toast({
        title: "Attendance marked",
        description: "Your attendance has been recorded for today.",
        variant: "default",
      });
    }
  };

  const handleSubjectToggle = (subject: string) => {
    if (subjects.includes(subject)) {
      const updatedSubjects = subjects.filter((s) => s !== subject);
      setSubjects(updatedSubjects);

      toast({
        title: "Subject removed",
        description: `"${subject}" has been removed from your studied subjects for today.`,
        variant: "default",
      });
    } else {
      const updatedSubjects = [...subjects, subject];
      setSubjects(updatedSubjects);

      toast({
        title: "Subject added",
        description: `"${subject}" has been added to your studied subjects for today.`,
        variant: "default",
      });
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticTodo: Todo = {
      $id: tempId,
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      pointsAwarded: false,
    };

    setTodos((prevTodos) => [...prevTodos, optimisticTodo]);
    const originalTodoText = newTodo;
    setNewTodo("");

    try {
      const createdTodo = await createTodo(user.$id, originalTodoText.trim());
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.$id === tempId
            ? {
                $id: createdTodo.$id,
                text: createdTodo.text ?? "",
                completed: createdTodo.completed ?? false,
                createdAt: createdTodo.createdAt ?? new Date().toISOString(),
                pointsAwarded: false,
              }
            : todo
        )
      );
    } catch (error) {
      console.error("Error creating todo:", error);
      toast({
        title: "Error Adding Todo",
        description: "Could not save the new todo. Please try again.",
        variant: "destructive",
      });
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.$id !== tempId));
      setNewTodo(originalTodoText);
    }
  };

  const handleToggleTodo = async (id: string) => {
    const todoToUpdate = todos.find((todo) => todo.$id === id);
    if (!todoToUpdate) return;

    if (todoToUpdate.isProcessing) return;

    const originalTodos = [...todos];
    const newCompletedStatus = !todoToUpdate.completed;

    const updatedPointsAwarded = newCompletedStatus
      ? false
      : todoToUpdate.pointsAwarded;

    setTodos(
      todos.map((todo) =>
        todo.$id === id
          ? {
              ...todo,
              completed: newCompletedStatus,
              pointsAwarded: updatedPointsAwarded,
              isProcessing: true,
            }
          : todo
      )
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      await updateTodo(id, {
        completed: newCompletedStatus,
        pointsAwarded: updatedPointsAwarded,
      });

      setTodos((currentTodos) =>
        currentTodos.map((todo) =>
          todo.$id === id
            ? {
                ...todo,
                isProcessing: false,
              }
            : todo
        )
      );
    } catch (error) {
      console.error("Error updating todo:", error);
      toast({
        title: "Error Updating Todo",
        description: "Could not update the todo status. Please try again.",
        variant: "destructive",
      });
      setTodos(originalTodos);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    const originalTodos = [...todos];
    const todoToDelete = todos.find((t) => t.$id === id);

    setTodos(todos.filter((todo) => todo.$id !== id));

    try {
      await deleteTodo(id);
      toast({
        title: "Todo Deleted",
        description: `"${todoToDelete?.text}" was successfully deleted.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast({
        title: "Error Deleting Todo",
        description: "Could not delete the todo. Please try again.",
        variant: "destructive",
      });
      setTodos(originalTodos);
    }
  };

  const calculatePoints = () => {
    let points = 0;

    if (attendance && !attendancePointsAwarded) {
      points += 5;
    }

    subjects.forEach((subject) => {
      if (!subjectsPointsAwarded[subject]) {
        points += 10;
      }
    });

    todos.forEach((todo) => {
      if (todo.completed && !todo.pointsAwarded) {
        points += 15;
      }
    });

    const newPomodoroSessions = pomodoroCount - lastPomodoroPointsAwarded;
    if (newPomodoroSessions > 0) {
      const basePointsPerPomodoro = 20;
      const pointAdjustmentFactor = focusMinutes > 0 ? focusMinutes / 25 : 1;
      points += Math.round(
        newPomodoroSessions * basePointsPerPomodoro * pointAdjustmentFactor
      );
    }

    return points;
  };

  const calculatePomodoroPoints = () => {
    const basePointsPerPomodoro = 20;
    const pointAdjustmentFactor = focusMinutes > 0 ? focusMinutes / 25 : 1;
    return Math.round(
      pomodoroCount * basePointsPerPomodoro * pointAdjustmentFactor
    );
  };

  const calculateNewPomodoroPoints = () => {
    const newPomodoroSessions = pomodoroCount - lastPomodoroPointsAwarded;
    if (newPomodoroSessions <= 0) return 0;

    const basePointsPerPomodoro = 20;
    const pointAdjustmentFactor = focusMinutes > 0 ? focusMinutes / 25 : 1;
    return Math.round(
      newPomodoroSessions * basePointsPerPomodoro * pointAdjustmentFactor
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    setIsBreak(false);
    setTimeLeft(focusMinutes * 60);
    setTimerProgress(100);
    setIsTimerActive(true);
    setIsTimerPaused(false);
    setShowFullScreen(true);
    setCurrentQuote(
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    );
  };

  const pauseTimer = () => {
    setIsTimerPaused(true);
  };

  const resumeTimer = () => {
    setIsTimerPaused(false);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsTimerActive(false);
    setIsTimerPaused(false);
    setIsBreak(false);
    setTimeLeft(focusMinutes * 60);
    setShowFullScreen(false);
    setTimerProgress(100);
  };

  const handleFocusMinutesChange = (value: number) => {
    setFocusMinutes(value);
    if (!isTimerActive && !isBreak) {
      setTimeLeft(value * 60);
      setTimerProgress(100);
    }
  };

  const handleBreakMinutesChange = (value: number) => {
    setBreakMinutes(value);
    if (!isTimerActive && isBreak) {
      setTimeLeft(value * 60);
      setTimerProgress(100);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    const points = calculatePoints();
    if (isNaN(points)) {
      console.error("Invalid points value:", points);
      toast({
        title: "Points Calculation Error",
        description:
          "There was an error calculating your points. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (points === 0) {
      toast({
        title: "No New Progress",
        description:
          "You haven't made any new progress since your last submission.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setEarnedPoints(points);

    const dialog = document.getElementById(
      "summary-modal"
    ) as HTMLDialogElement | null;
    if (dialog && dialog.open) {
      dialog.close();
    }
    setSubmitted(true);

    try {
      const newActivities: ProgressActivity[] = [];

      if (attendance && !attendancePointsAwarded) {
        newActivities.push({
          id: `attendance-${Date.now()}`,
          type: "attendance",
          details: "Marked attendance",
          points: 5,
          timestamp: new Date().toISOString(),
        });
      }

      subjects.forEach((subject) => {
        if (!subjectsPointsAwarded[subject]) {
          newActivities.push({
            id: `subject-${subject}-${Date.now()}`,
            type: "subject",
            details: subject,
            points: 10,
            timestamp: new Date().toISOString(),
          });
        }
      });

      todos.forEach((todo) => {
        if (todo.completed && !todo.pointsAwarded) {
          newActivities.push({
            id: `todo-${todo.$id}-${Date.now()}`,
            type: "todo",
            details: todo.text,
            points: 15,
            timestamp: new Date().toISOString(),
          });
        }
      });

      const newPomodoroSessions = pomodoroCount - lastPomodoroPointsAwarded;
      if (newPomodoroSessions > 0) {
        const pomodoroPoints = calculateNewPomodoroPoints();
        newActivities.push({
          id: `pomodoro-${Date.now()}`,
          type: "pomodoro",
          details: `${newPomodoroSessions} pomodoro sessions`,
          points: pomodoroPoints,
          timestamp: new Date().toISOString(),
        });
      }

      const allActivities = [...progressActivities, ...newActivities];
      setProgressActivities(allActivities);

      if (attendance) {
        setAttendancePointsAwarded(true);
      }

      const updatedSubjectsPointsAwarded = { ...subjectsPointsAwarded };
      subjects.forEach((subject) => {
        updatedSubjectsPointsAwarded[subject] = true;
      });
      setSubjectsPointsAwarded(updatedSubjectsPointsAwarded);

      const updatedTodos = todos.map((todo) => {
        if (todo.completed && !todo.pointsAwarded) {
          return { ...todo, pointsAwarded: true };
        }
        return todo;
      });
      setTodos(updatedTodos);

      setLastPomodoroPointsAwarded(pomodoroCount);

      const currentProgress = {
        attendance,
        subjects,
        pomodoroCount,
        focusMinutes,
        breakMinutes,
        points: points,
        completedTodos: todos.filter((t) => t.completed).length,
        activities: JSON.stringify(allActivities),
        lastSubmission: new Date().toISOString(),
      };
      await logProgress(user.$id, currentProgress);

      const currentPoints = typeof user.points === "number" ? user.points : 0;
      const currentStreak = typeof user.streak === "number" ? user.streak : 0;

      await updateLeaderboardPoints(user.$id, points);

      await updateUserData({
        points: currentPoints + points,
        streak: hasExistingProgress ? currentStreak : currentStreak + 1,
      });

      setHasExistingProgress(true);

      for (const todo of updatedTodos) {
        if (todo.completed && todo.pointsAwarded) {
          await updateTodo(todo.$id, { pointsAwarded: true });
        }
      }

      router({ to: "/leaderboard" });
    } catch (error) {
      console.error("Error submitting progress:", error);
      toast({
        title: "Submission Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
      setSubmitted(false);
      setEarnedPoints(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-2xl font-bold animate-pulse">
            Loading progress tracker...
          </h2>
          <p className="text-muted-foreground">Preparing your academic log</p>
        </div>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <div className="container py-8 max-w-4xl text-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Logged In</AlertTitle>
          <AlertDescription>
            Please log in to track your progress.
            <Button onClick={() => router({ to: "/login" })} className="ml-4">
              Login
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-2xl font-bold animate-pulse">
            Redirecting to leaderboard...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl relative">
      {showFullScreen && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/95 via-blue-900/90 to-purple-900/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8 text-right">
            <div className="text-lg sm:text-2xl font-light text-white/70">
              {formatDate(currentDateTime)}
            </div>
            <div className="text-sm sm:text-lg font-light text-white/50">
              Hello, {user?.name ?? "Scholar"}
            </div>
          </div>

          <div className="text-center space-y-6 max-w-xl w-full mx-auto p-6 rounded-xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm">
            <div className="relative mx-auto w-60 h-60 sm:w-72 sm:h-72">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <defs>
                  <linearGradient
                    id="timerGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor={isBreak ? "#10B981" : "#3B82F6"}
                    />
                    <stop
                      offset="100%"
                      stopColor={isBreak ? "#059669" : "#1D4ED8"}
                    />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#timerGradient)"
                  strokeWidth="8"
                  strokeDasharray="282.7"
                  strokeDashoffset={
                    282.7 -
                    (282.7 * Math.max(0, Math.min(100, timerProgress))) / 100
                  }
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-5xl sm:text-7xl font-bold text-white tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-white/70 text-lg sm:text-xl mt-2">
                  {isBreak ? "Break Time" : "Focus Time"}
                </div>
              </div>
            </div>

            <div className="text-white text-xl sm:text-2xl font-medium flex items-center justify-center gap-3 mt-4">
              {isBreak ? (
                <>
                  <Coffee className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />{" "}
                  Relax and Recharge
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" /> Stay
                  Focused
                </>
              )}
            </div>

            {currentTodoForPomodoro && currentTodoForPomodoro !== "none" && (
              <div className="bg-white/10 p-4 rounded-lg border border-white/20 mt-4 max-w-md mx-auto">
                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
                  Current Task:
                </p>
                <p className="text-white text-lg font-medium truncate">
                  {todos.find((t) => t.text === currentTodoForPomodoro)?.text ||
                    currentTodoForPomodoro}
                </p>
              </div>
            )}

            <div className="italic text-white/80 px-4 sm:px-8 py-4 border-l-4 border-blue-500 bg-white/5 rounded-r-lg mt-6 max-w-md mx-auto">
              <p className="text-lg sm:text-xl">"{currentQuote}"</p>
            </div>

            <div className="flex gap-4 sm:gap-6 justify-center mt-6">
              {isTimerPaused ? (
                <Button
                  onClick={resumeTimer}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-xl"
                >
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={pauseTimer}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-xl"
                >
                  Pause
                </Button>
              )}
              <Button
                onClick={resetTimer}
                variant="destructive"
                className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-xl"
              >
                Exit Timer
              </Button>
            </div>

            <div className="flex items-center justify-between text-white bg-white/10 p-4 rounded-lg mt-6 max-w-md mx-auto">
              <div className="text-base sm:text-lg">
                Completed: <span className="font-bold">{pomodoroCount}</span>
              </div>
              <div className="text-base sm:text-lg">
                Points:{" "}
                <span className="font-bold text-green-400">
                  +{calculatePomodoroPoints()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {progressActivities.length > 0 && (
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">
              Today's Progress
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              You've earned points today from {progressActivities.length}{" "}
              activities. You can continue to earn more points!
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="animate-slide-in-left">
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
              Log Your Progress
            </h1>
            <p className="text-muted-foreground">
              Track your daily academic activities and earn points
            </p>
            <div className="mt-2 text-sm text-muted-foreground">
              {formatDate(currentDateTime)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const demoDialog = document.getElementById(
                "demo-modal"
              ) as HTMLDialogElement | null;
              if (demoDialog) {
                demoDialog.showModal();
              }
            }}
            aria-label="How It Works"
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>

        <Alert className="bg-primary/10 border-primary/20 animate-slide-in-right">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Earn points by logging your progress</AlertTitle>
          <AlertDescription>
            +5 for attendance, +10 per subject, +15 per completed todo, +
            {Math.round((focusMinutes / 25) * 20)} per pomodoro session.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="attendance" className="w-full animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="todos">Todo & Timer</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <Card className="border-blue-200 dark:border-blue-800 overflow-hidden hover:shadow-lg transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Lecture Attendance</CardTitle>
                </div>
                <CardDescription>
                  Mark whether you attended lectures today
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attendance"
                    checked={attendance}
                    onCheckedChange={handleAttendanceToggle}
                    className={`h-6 w-6 transition-opacity ${attendanceLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                    disabled={attendanceLocked}
                    aria-label="Mark attendance for today"
                  />
                  <Label
                    htmlFor="attendance"
                    className="text-base cursor-pointer"
                  >
                    I Have Studied Today
                  </Label>
                  {attendancePointsAwarded && (
                    <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      +5 Points Awarded
                    </Badge>
                  )}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {attendance ? (
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      {attendancePointsAwarded
                        ? "You've already earned 5 points for attendance today."
                        : "+5 points will be awarded for attendance."}
                    </p>
                  ) : (
                    <p>Mark attendance to earn 5 points.</p>
                  )}
                </div>
                {attendanceLocked && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm border border-blue-100 dark:border-blue-800">
                    <span className="text-blue-700 dark:text-blue-300">
                      Note: Attendance for today is logged and cannot be
                      unmarked.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card className="border-green-200 dark:border-green-800 overflow-hidden hover:shadow-lg transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-700 dark:text-green-400" />
                  <CardTitle>Subjects Studied</CardTitle>
                </div>
                <CardDescription>
                  Select the subjects you studied today (+10 points each)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {sscSubjects.map((subject, index) => (
                    <div
                      key={subject}
                      className="flex items-center space-x-2 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Checkbox
                        id={`subject-${subject}`}
                        checked={subjects.includes(subject)}
                        onCheckedChange={() => handleSubjectToggle(subject)}
                        className="transition-opacity"
                        aria-label={`Mark ${subject} as studied`}
                      />
                      <Label
                        htmlFor={`subject-${subject}`}
                        className="cursor-pointer"
                      >
                        {subject}
                      </Label>
                      {subjects.includes(subject) && (
                        <Badge
                          variant="outline"
                          className={`ml-auto text-xs px-1.5 py-0.5 ${
                            subjectsPointsAwarded[subject]
                              ? "border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                              : "border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400"
                          }`}
                        >
                          {subjectsPointsAwarded[subject]
                            ? "Points Awarded"
                            : "Logged"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {subjects.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        {subjects.filter(
                          (subject) => !subjectsPointsAwarded[subject]
                        ).length > 0
                          ? `+${subjects.filter((subject) => !subjectsPointsAwarded[subject]).length * 10} points will be awarded for new subjects.`
                          : "No new subject points available."}
                      </p>
                      {subjects.filter(
                        (subject) => !subjectsPointsAwarded[subject]
                      ).length > 0 && (
                        <div className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center">
                          <span>
                            {
                              subjects.filter(
                                (subject) => !subjectsPointsAwarded[subject]
                              ).length
                            }{" "}
                            × 10 ={" "}
                            {subjects.filter(
                              (subject) => !subjectsPointsAwarded[subject]
                            ).length * 10}{" "}
                            pts
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>Select subjects to earn 10 points each.</p>
                  )}
                </div>
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-md text-sm border border-green-100 dark:border-green-800">
                  <span className="text-green-700 dark:text-green-300">
                    Note: You can uncheck a subject if you accidentally marked
                    it. Points will be adjusted accordingly.
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="todos">
            <Card className="border-orange-200 dark:border-orange-800 overflow-hidden hover:shadow-lg transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <div className="flex items-center gap-2">
                  <List className="h-5 w-5 text-orange-700 dark:text-orange-400" />
                  <CardTitle>Todo List & Pomodoro Timer</CardTitle>
                </div>
                <CardDescription>
                  Manage tasks (+15 points each) and use the focus timer.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddTodo} className="flex gap-2 mb-6">
                  <Input
                    placeholder="Add a new task..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    className="flex-1"
                    aria-label="New todo text"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-orange-500 hover:bg-orange-600"
                    aria-label="Add new todo"
                    disabled={!newTodo.trim()}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </form>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 mb-6 border-t border-b py-4 border-border">
                  {todos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <List className="h-8 w-8 mx-auto mb-2" />
                      No tasks yet. Add some above!
                    </div>
                  ) : (
                    todos.map((todo, index) => (
                      <div
                        key={todo.$id}
                        className={`flex items-center justify-between p-3 rounded-lg border animate-fade-in transition-colors ${
                          todo.completed
                            ? "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800 opacity-70"
                            : "bg-background border-border"
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox
                            id={`todo-${todo.$id}`}
                            checked={todo.completed}
                            onCheckedChange={() => handleToggleTodo(todo.$id)}
                            aria-labelledby={`todo-label-${todo.$id}`}
                            className={
                              todo.completed
                                ? "border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                                : ""
                            }
                          />
                          <Label
                            id={`todo-label-${todo.$id}`}
                            htmlFor={`todo-${todo.$id}`}
                            className={`flex-1 truncate cursor-pointer ${todo.completed ? "line-through text-muted-foreground" : ""}`}
                          >
                            {todo.text}
                          </Label>
                          {todo.completed && todo.pointsAwarded && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0.5 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400"
                            >
                              +15 Awarded
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTodo(todo.$id)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8 ml-2"
                          aria-label={`Delete todo: ${todo.text}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mb-6 text-sm text-muted-foreground">
                  {todos.filter((t) => t.completed && !t.pointsAwarded).length >
                  0 ? (
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      +
                      {todos.filter((t) => t.completed && !t.pointsAwarded)
                        .length * 15}{" "}
                      points will be awarded for newly completed todos.
                    </p>
                  ) : todos.filter((t) => t.completed).length > 0 ? (
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      Complete more todos or mark existing ones as incomplete
                      and complete them again to earn more points.
                    </p>
                  ) : (
                    <p>Complete todos to earn 15 points each.</p>
                  )}
                </div>

                <div className="bg-muted/50 dark:bg-muted/20 p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2 text-base">
                      <Clock className="h-5 w-5 text-primary" />
                      Pomodoro Timer
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingTime(!isEditingTime)}
                      className="text-muted-foreground"
                      aria-label={
                        isEditingTime
                          ? "Collapse timer settings"
                          : "Expand timer settings"
                      }
                    >
                      Settings
                      {isEditingTime ? (
                        <ChevronUp className="h-4 w-4 ml-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </Button>
                  </div>

                  {isEditingTime && (
                    <div className="space-y-4 mb-6 animate-fade-in border-t pt-4 mt-2 border-border">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Label
                            htmlFor="focus-minutes"
                            className="text-sm font-medium"
                          >
                            Focus Time: {focusMinutes} min
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            +{Math.round((focusMinutes / 25) * 20)} pts /
                            session
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleFocusMinutesChange(
                                Math.max(5, focusMinutes - 5)
                              )
                            }
                            disabled={focusMinutes <= 5}
                            className="h-8 w-8"
                            aria-label="Decrease focus time"
                          >
                            {" "}
                            -{" "}
                          </Button>
                          <Slider
                            id="focus-minutes"
                            min={5}
                            max={60}
                            step={5}
                            value={[focusMinutes]}
                            onValueChange={(values) =>
                              handleFocusMinutesChange(values[0])
                            }
                            className="flex-1"
                            aria-label="Focus time slider"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleFocusMinutesChange(
                                Math.min(60, focusMinutes + 5)
                              )
                            }
                            disabled={focusMinutes >= 60}
                            className="h-8 w-8"
                            aria-label="Increase focus time"
                          >
                            {" "}
                            +{" "}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="break-minutes"
                          className="text-sm font-medium mb-1 block"
                        >
                          Break Time: {breakMinutes} min
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleBreakMinutesChange(
                                Math.max(1, breakMinutes - 1)
                              )
                            }
                            disabled={breakMinutes <= 1}
                            className="h-8 w-8"
                            aria-label="Decrease break time"
                          >
                            {" "}
                            -{" "}
                          </Button>
                          <Slider
                            id="break-minutes"
                            min={1}
                            max={30}
                            step={1}
                            value={[breakMinutes]}
                            onValueChange={(values) =>
                              handleBreakMinutesChange(values[0])
                            }
                            className="flex-1"
                            aria-label="Break time slider"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleBreakMinutesChange(
                                Math.min(30, breakMinutes + 1)
                              )
                            }
                            disabled={breakMinutes >= 30}
                            className="h-8 w-8"
                            aria-label="Increase break time"
                          >
                            {" "}
                            +{" "}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select
                      value={currentTodoForPomodoro}
                      onValueChange={setCurrentTodoForPomodoro}
                    >
                      <SelectTrigger className="w-full sm:flex-1">
                        <SelectValue placeholder="Focus on a task (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific task</SelectItem>
                        {todos
                          .filter((t) => !t.completed)
                          .map((todo) => (
                            <SelectItem key={todo.$id} value={todo.text}>
                              {todo.text}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={startTimer}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white w-full sm:w-auto"
                      disabled={isTimerActive}
                    >
                      <Timer className="h-4 w-4 mr-2" /> Start Focus Session
                    </Button>
                  </div>

                  {pomodoroCount > 0 && (
                    <div className="mt-4 text-sm text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          Completed {pomodoroCount} focus session
                          {pomodoroCount > 1 ? "s" : ""}
                        </p>
                        {pomodoroCount > lastPomodoroPointsAwarded ? (
                          <Badge className="self-center sm:self-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            +{calculateNewPomodoroPoints()} points available
                          </Badge>
                        ) : (
                          <Badge className="self-center sm:self-auto bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                            Points already awarded
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        {lastPomodoroPointsAwarded > 0
                          ? `${lastPomodoroPointsAwarded} sessions already awarded points. Complete more for additional points!`
                          : "Submit to earn points for your focus sessions."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => {
              const dialog = document.getElementById(
                "summary-modal"
              ) as HTMLDialogElement | null;
              if (dialog) {
                dialog.showModal();
              } else {
                console.error("Summary modal dialog not found");
              }
            }}
            className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 p-0 flex items-center justify-center text-white"
            aria-label="Show Progress Summary"
          >
            <ChevronUp className="h-6 w-6" />
          </Button>
        </div>

        <dialog
          id="demo-modal"
          className="modal modal-bottom sm:modal-middle p-0 rounded-t-xl sm:rounded-xl max-w-4xl w-full mx-auto"
          aria-labelledby="demo-title"
        >
          <div className="modal-box p-0 bg-background rounded-t-xl sm:rounded-xl w-full max-w-4xl mx-auto overflow-hidden border border-border shadow-2xl">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 flex justify-between items-center sticky top-0 z-10 border-b border-border">
              <h2 id="demo-title" className="text-xl font-bold">
                How It Works
              </h2>
              <form method="dialog">
                <Button variant="ghost" size="icon" aria-label="Close demo">
                  <X className="h-5 w-5" />
                </Button>
              </form>
            </div>
            <div className="p-6 max-h-[65vh] overflow-y-auto">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2">
                    Welcome to Progress Tracker!
                  </h3>
                  <p className="text-muted-foreground">
                    This app helps you track your daily academic activities and
                    earn points to stay motivated.
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Features</h3>
                  <ul className="space-y-4">
                    <li>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Attendance</h4>
                          <p className="text-sm text-muted-foreground">
                            Mark if you attended lectures today. Earn +5 points.
                          </p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Subjects</h4>
                          <p className="text-sm text-muted-foreground">
                            Log the subjects you studied today. Earn +10 points
                            each.
                          </p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-start gap-3">
                        <List className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Todo List</h4>
                          <p className="text-sm text-muted-foreground">
                            Add and complete tasks. Earn +15 points each.
                          </p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-start gap-3">
                        <Timer className="h-5 w-5 text-purple-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Pomodoro Timer</h4>
                          <p className="text-sm text-muted-foreground">
                            Use the timer for focused study sessions. Earn +20
                            points per session (adjusted by focus time).
                          </p>
                        </div>
                      </div>
                    </li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">How to Use</h3>
                  <ol className="space-y-4 list-decimal list-inside">
                    <li>
                      <span className="font-medium">Log Activities:</span> Use
                      the tabs to navigate between Attendance, Subjects, and
                      Todo & Timer. Mark attendance, select subjects, add and
                      complete todos, and use the Pomodoro timer.
                    </li>
                    <li>
                      <span className="font-medium">Review Progress:</span>{" "}
                      Click the floating button at the bottom right to open the
                      Summary Modal. Review your earned points from each
                      activity.
                    </li>
                    <li>
                      <span className="font-medium">Submit Progress:</span> In
                      the Summary Modal, click "Submit Progress" to save your
                      progress and earn points. Your points will be added to
                      your total, and you can see your ranking on the
                      leaderboard.
                    </li>
                  </ol>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">Tips</h3>
                  <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                    <li>
                      You can submit your progress multiple times a day to earn
                      more points.
                    </li>
                    <li>
                      Complete more activities to maximize your daily points.
                    </li>
                    <li>
                      Use the Pomodoro timer for effective study sessions.
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </dialog>

        <dialog
          id="summary-modal"
          className="modal modal-bottom sm:modal-middle p-0 rounded-t-xl sm:rounded-xl max-w-4xl w-full mx-auto"
          aria-labelledby="summary-title"
        >
          <div className="modal-box p-0 bg-background rounded-t-xl sm:rounded-xl w-full max-w-4xl mx-auto overflow-hidden border border-border shadow-2xl">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 flex justify-between items-center sticky top-0 z-10 border-b border-border">
              <div>
                <h2 id="summary-title" className="text-xl font-bold">
                  Progress Summary
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review your progress before submitting.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/80 dark:bg-black/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-inner">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold text-lg tabular-nums">
                    {calculatePoints()}
                  </span>
                  <span className="text-xs text-muted-foreground">new pts</span>
                </div>
                <form method="dialog" className="ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close summary"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="subjects">Subjects</TabsTrigger>
                  <TabsTrigger value="todos">Todos & Timer</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-blue-200 dark:border-blue-800 overflow-hidden">
                      <CardHeader className="bg-blue-50 dark:bg-blue-950/50 p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-blue-500" />{" "}
                            Attendance
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-xs ${attendance ? "border-blue-500 text-blue-600 dark:border-blue-600 dark:text-blue-300" : ""}`}
                          >
                            {attendance && !attendancePointsAwarded
                              ? "+5 pts"
                              : "0 pts"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 min-h-[6rem] flex items-center justify-center">
                        {attendance ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium text-sm">
                              Attended{" "}
                              {attendancePointsAwarded &&
                                "(Points Already Awarded)"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <X className="h-5 w-5" />
                            <span className="text-sm">Not Marked</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 dark:border-purple-800 overflow-hidden">
                      <CardHeader className="bg-purple-50 dark:bg-purple-950/50 p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                            <Timer className="h-4 w-4 text-purple-500" />{" "}
                            Pomodoro
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-xs ${pomodoroCount > lastPomodoroPointsAwarded ? "border-purple-500 text-purple-600 dark:border-purple-600 dark:text-purple-300" : ""}`}
                          >
                            +{calculateNewPomodoroPoints()} pts
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 min-h-[6rem] flex items-center justify-center">
                        {pomodoroCount > 0 ? (
                          <div className="text-center">
                            <div className="text-xl font-bold tabular-nums">
                              {pomodoroCount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Sessions
                            </div>
                            <div className="text-xs mt-0.5">
                              ({focusMinutes}/{breakMinutes} min)
                            </div>
                            {lastPomodoroPointsAwarded > 0 && (
                              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                {lastPomodoroPointsAwarded} sessions already
                                awarded
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-5 w-5" />
                            <span className="text-sm">No Sessions</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 dark:border-green-800 overflow-hidden md:col-span-2">
                      <CardHeader className="bg-green-50 dark:bg-green-950/50 p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4 text-green-500" />{" "}
                            Subjects Studied
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-xs ${subjects.filter((s) => !subjectsPointsAwarded[s]).length > 0 ? "border-green-500 text-green-600 dark:border-green-600 dark:text-green-300" : ""}`}
                          >
                            +
                            {subjects.filter((s) => !subjectsPointsAwarded[s])
                              .length * 10}{" "}
                            pts
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 min-h-[6rem]">
                        {subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {subjects.map((subject) => (
                              <Badge
                                key={subject}
                                variant="secondary"
                                className={`text-xs font-normal ${
                                  subjectsPointsAwarded[subject]
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                                }`}
                              >
                                {subject}{" "}
                                {subjectsPointsAwarded[subject] && "✓"}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <span className="text-sm">No subjects logged</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 dark:border-orange-800 overflow-hidden md:col-span-2">
                      <CardHeader className="bg-orange-50 dark:bg-orange-950/50 p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                            <List className="h-4 w-4 text-orange-500" />{" "}
                            Completed Todos
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-xs ${todos.filter((t) => t.completed && !t.pointsAwarded).length > 0 ? "border-orange-500 text-orange-600 dark:border-orange-600 dark:text-orange-300" : ""}`}
                          >
                            +
                            {todos.filter(
                              (t) => t.completed && !t.pointsAwarded
                            ).length * 15}{" "}
                            pts
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 min-h-[6rem]">
                        {todos.filter((t) => t.completed).length > 0 ? (
                          <div className="grid gap-1.5 max-h-40 overflow-y-auto pr-1">
                            {todos
                              .filter((t) => t.completed)
                              .map((todo) => (
                                <div
                                  key={todo.$id}
                                  className={`text-xs flex items-center gap-1.5 p-1 rounded ${
                                    todo.pointsAwarded
                                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                                  }`}
                                >
                                  <CheckCircle className="h-3 w-3 flex-shrink-0" />
                                  <span className="line-through truncate">
                                    {todo.text}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="ml-auto text-xs px-1 py-0 border-orange-300 text-orange-600 dark:border-orange-600 dark:text-orange-300"
                                  >
                                    {todo.pointsAwarded ? "Awarded" : "+15"}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <span className="text-sm">No todos completed</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="attendance">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Attendance Details
                      </CardTitle>
                      <CardDescription>
                        Points earned for attending lectures today.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-10">
                      {attendance ? (
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                            <CheckCircle className="h-8 w-8 text-blue-500" />
                          </div>
                          <h3 className="text-lg font-medium">
                            Attendance Confirmed
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {attendancePointsAwarded
                              ? "You've already earned 5 points for attendance today."
                              : "You will earn +5 points."}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted dark:bg-muted/30 mb-3">
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium">
                            No Attendance Marked
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            Mark attendance to earn 5 points.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="subjects">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Subjects Studied Details
                      </CardTitle>
                      <CardDescription>
                        Points earned per subject studied today.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {subjects.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {subjects.map((subject, index) => (
                              <div
                                key={subject}
                                className={`p-3 rounded-lg ${
                                  subjectsPointsAwarded[subject]
                                    ? "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800"
                                    : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800"
                                } text-center animate-fade-in`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                              >
                                <BookOpen className="h-6 w-6 mx-auto mb-1 text-green-500" />
                                <div className="text-sm font-medium">
                                  {subject}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                  {subjectsPointsAwarded[subject]
                                    ? "Points Awarded"
                                    : "+10 pts"}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-700">
                            <div className="font-medium text-sm">
                              New Subject Points
                            </div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
                              +
                              {subjects.filter((s) => !subjectsPointsAwarded[s])
                                .length * 10}{" "}
                              pts
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                          <h3 className="text-lg font-medium">
                            No Subjects Logged
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                            Mark subjects as studied to earn 10 points each.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="todos">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Todo & Timer Details
                      </CardTitle>
                      <CardDescription>
                        Points from completed tasks and focus sessions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-6">
                      <div>
                        <h4 className="font-medium mb-2 text-sm flex items-center gap-1.5">
                          <List className="h-4 w-4" /> Todo Completion
                        </h4>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 mb-2">
                          <div className="text-sm font-medium">
                            Completion Rate
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                                style={{
                                  width: `${todos.length > 0 ? (todos.filter((t) => t.completed).length / todos.length) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium tabular-nums">
                              {todos.filter((t) => t.completed).length}/
                              {todos.length}
                            </span>
                          </div>
                        </div>
                        {todos.filter((t) => t.completed).length > 0 ? (
                          <div className="space-y-1.5">
                            <div className="grid gap-1.5 max-h-40 overflow-y-auto pr-1">
                              {todos
                                .filter((t) => t.completed)
                                .map((todo) => (
                                  <div
                                    key={todo.$id}
                                    className={`text-xs flex items-center gap-1.5 p-1.5 rounded border ${
                                      todo.pointsAwarded
                                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 border-orange-200 dark:border-orange-700"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-700"
                                    }`}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                                    <span className="line-through truncate">
                                      {todo.text}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="ml-auto text-xs px-1 py-0 border-orange-300 text-orange-600 dark:border-orange-600 dark:text-orange-300"
                                    >
                                      {todo.pointsAwarded ? "Awarded" : "+15"}
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-700 mt-2">
                              <div className="font-medium text-sm">
                                New Todo Points
                              </div>
                              <div className="text-lg font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                                +
                                {todos.filter(
                                  (t) => t.completed && !t.pointsAwarded
                                ).length * 15}{" "}
                                pts
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-sm text-muted-foreground py-4">
                            No todos completed yet.
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-sm flex items-center gap-1.5">
                          <Timer className="h-4 w-4" /> Pomodoro Sessions
                        </h4>
                        {pomodoroCount > 0 ? (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                            <div>
                              <div className="text-sm font-medium">
                                Sessions Completed
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {pomodoroCount} x ({focusMinutes} min focus /{" "}
                                {breakMinutes} min break)
                              </div>
                              {lastPomodoroPointsAwarded > 0 && (
                                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                  {lastPomodoroPointsAwarded} sessions already
                                  awarded points
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                              +{calculateNewPomodoroPoints()} pts
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-sm text-muted-foreground py-4">
                            No Pomodoro sessions completed.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-t border-border sticky bottom-0">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="bg-background dark:bg-muted/30 rounded-lg p-3 flex-1 w-full sm:w-auto border border-border">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient
                            id="modalGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#10B981" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="rgba(128,128,128,0.15)"
                          strokeWidth="10"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="url(#modalGradient)"
                          strokeWidth="10"
                          strokeDasharray="282.7"
                          strokeDashoffset={calculatePoints() > 0 ? 0 : 282.7}
                          transform="rotate(-90 50 50)"
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-yellow-500" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold tabular-nums">
                        {calculatePoints()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        New Points Available
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  className={`w-full sm:w-auto sm:flex-initial px-8 py-3 text-base bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${calculatePoints() > 0 ? "hover:scale-105" : ""}`}
                  disabled={calculatePoints() === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Progress"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </dialog>
      </div>
    </div>
  );
}
