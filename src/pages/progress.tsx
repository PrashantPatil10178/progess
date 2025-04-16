"use client";

import React, { useState, useEffect, useRef } from "react";
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
  CardFooter,
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
  ChevronDown,
  Clock,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

interface Todo {
  $id: string;
  text: string;
  completed: boolean;
  createdAt: string;
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
  const [currentDateTime, setCurrentDateTime] = useState(
    new Date("2025-04-09T12:31:00Z")
  );
  console.log(setCurrentDateTime);

  const [attendance, setAttendance] = useState(false);
  const [attendanceLocked, setAttendanceLocked] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectsLocked, setSubjectsLocked] = useState<{
    [key: string]: boolean;
  }>({});
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [currentTodoForPomodoro, setCurrentTodoForPomodoro] =
    useState<string>("none");

  // Timer settings
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
  const timerRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const breakAudioRef = useRef<HTMLAudioElement | null>(null);

  const sscSubjects = [
    "English",
    "Hindi",
    "Marathi",
    "Science",
    "Social Science",
    "Information Technology",
  ];

  useEffect(() => {
    const initializeData = async () => {
      if (!user) return;

      try {
        const todayProgress = await getTodayProgress(user.$id);
        if (todayProgress) {
          setHasExistingProgress(true);
          setAttendance(todayProgress.attendance || false);
          setAttendanceLocked(todayProgress.attendance || false);

          const savedSubjects = todayProgress.subjects || [];
          setSubjects(savedSubjects);

          // Lock any subjects that were already marked
          const lockedSubjectsObj: { [key: string]: boolean } = {};
          savedSubjects.forEach((subject: string) => {
            lockedSubjectsObj[subject] = true;
          });
          setSubjectsLocked(lockedSubjectsObj);

          setPomodoroCount(todayProgress.pomodoroCount || 0);
        }

        const userTodos = await getUserTodos(user.$id);
        setTodos(
          userTodos.map((doc) => ({
            $id: doc.$id,
            text: doc.text || "",
            completed: doc.completed || false,
            createdAt: doc.createdAt || "",
          }))
        );
      } catch (error) {
        console.error("Error initializing data", error);
      } finally {
        setIsLoading(false);
      }
    };

    audioRef.current = new Audio("/notification.mp3");
    breakAudioRef.current = new Audio("/break-notification.mp3");

    // Set initial motivational quote
    setCurrentQuote(
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    );

    initializeData();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  useEffect(() => {
    if (isTimerActive && !isTimerPaused) {
      const totalTime = isBreak ? breakMinutes * 60 : focusMinutes * 60;

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Play notification sounds automatically
            if (!isBreak && audioRef.current) {
              audioRef.current.play();
            } else if (isBreak && breakAudioRef.current) {
              breakAudioRef.current.play();
            }

            // Show toast notification
            toast({
              title: isBreak ? "Break Time Over!" : "Focus Session Completed!",
              description: isBreak
                ? "Time to get back to work. Starting a new focus session."
                : "Great job! Take a short break now.",
              variant: "default",
            });

            if (!isBreak) {
              setPomodoroCount((prev) => prev + 1);
              setIsBreak(true);
              setCurrentQuote(
                motivationalQuotes[
                  Math.floor(Math.random() * motivationalQuotes.length)
                ]
              );
              return breakMinutes * 60;
            } else {
              setIsBreak(false);
              setCurrentQuote(
                motivationalQuotes[
                  Math.floor(Math.random() * motivationalQuotes.length)
                ]
              );
              return focusMinutes * 60;
            }
          }

          // Update progress percentage
          const progressPercentage = ((prev - 1) / totalTime) * 100;
          setTimerProgress(progressPercentage);

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, isTimerPaused, isBreak, focusMinutes, breakMinutes]);

  const handleAttendanceToggle = (checked: boolean) => {
    if (attendanceLocked && !checked) {
      toast({
        title: "Cannot unmark attendance",
        description: "Once attendance is marked, it cannot be unmarked.",
        variant: "destructive",
      });
      return;
    }

    setAttendance(checked);
    if (checked) {
      setAttendanceLocked(true);
      toast({
        title: "Attendance marked",
        description: "Your attendance has been recorded for today.",
        variant: "default",
      });
    }
  };

  const handleSubjectToggle = (subject: string) => {
    // If the subject is already locked and user is trying to unmark it, show error
    if (subjectsLocked[subject] && subjects.includes(subject)) {
      toast({
        title: "Cannot unmark subject",
        description: `Once "${subject}" is marked as studied, it cannot be unmarked.`,
        variant: "destructive",
      });
      return;
    }

    // If adding a new subject
    if (!subjects.includes(subject)) {
      const updatedSubjects = [...subjects, subject];
      setSubjects(updatedSubjects);

      // Lock this subject
      setSubjectsLocked((prev) => ({
        ...prev,
        [subject]: true,
      }));

      toast({
        title: "Subject added",
        description: `"${subject}" has been added to your studied subjects.`,
        variant: "default",
      });
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim() && user) {
      try {
        const createdTodo = await createTodo(user.$id, newTodo);
        setTodos([
          ...todos,
          {
            $id: createdTodo.$id,
            text: createdTodo.text || "",
            completed: createdTodo.completed || false,
            createdAt: createdTodo.createdAt || "",
          } as Todo,
        ]);
        setNewTodo("");
      } catch (error) {
        console.error("Error creating todo", error);
      }
    }
  };

  const handleToggleTodo = async (id: string) => {
    try {
      const todoToUpdate = todos.find((todo) => todo.$id === id);
      if (todoToUpdate) {
        await updateTodo(id, { completed: !todoToUpdate.completed });
        setTodos(
          todos.map((todo) =>
            todo.$id === id ? { ...todo, completed: !todo.completed } : todo
          )
        );
      }
    } catch (error) {
      console.error("Error updating todo", error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos(todos.filter((todo) => todo.$id !== id));
    } catch (error) {
      console.error("Error deleting todo", error);
    }
  };

  const calculatePoints = () => {
    // Adjust points based on custom timer settings
    const basePointsPerPomodoro = 20;
    const pointAdjustmentFactor = focusMinutes / 25; // Adjust based on focus time compared to standard 25
    const pomodoroPoints = Math.round(
      pomodoroCount * basePointsPerPomodoro * pointAdjustmentFactor
    );

    let points = 0;
    if (attendance) points += 5;
    points += subjects.length * 10;
    points += todos.filter((todo) => todo.completed).length * 15;
    points += pomodoroPoints;
    return points;
  };

  const calculatePomodoroPoints = () => {
    const basePointsPerPomodoro = 20;
    const pointAdjustmentFactor = focusMinutes / 25; // Adjust based on focus time compared to standard 25
    return Math.round(
      pomodoroCount * basePointsPerPomodoro * pointAdjustmentFactor
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    setIsTimerActive(true);
    setIsTimerPaused(false);
    setShowFullScreen(true);

    // Reset timer with current settings
    setTimeLeft(isBreak ? breakMinutes * 60 : focusMinutes * 60);
    setTimerProgress(100);

    // Get a new motivational quote
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
    setIsTimerActive(false);
    setIsTimerPaused(false);
    setTimeLeft(focusMinutes * 60);
    setIsBreak(false);
    setShowFullScreen(false);
    setTimerProgress(100);
  };

  const handleFocusMinutesChange = (value: number) => {
    setFocusMinutes(value);
    if (!isBreak && !isTimerActive) {
      setTimeLeft(value * 60);
    }
  };

  const handleBreakMinutesChange = (value: number) => {
    setBreakMinutes(value);
    if (isBreak && !isTimerActive) {
      setTimeLeft(value * 60);
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
    setEarnedPoints(points);
    setSubmitted(true);

    try {
      await logProgress(user.$id, {
        attendance,
        subjects,
        pomodoroCount,
        focusMinutes,
        breakMinutes,
        points,
        completedTodos: todos.filter((t) => t.completed).length,
      });

      await updateUserData({
        points: (user.points || 0) + points,
        streak: hasExistingProgress ? user.streak || 0 : (user.streak || 0) + 1,
      });

      setTimeout(() => {
        router({ to: "/dashboard" });
      }, 3000);
    } catch (error) {
      console.error("Error submitting progress", error);
      setSubmitted(false);
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

  if (submitted) {
    return (
      <div className="container py-8 max-w-4xl">
        <Card className="border-green-500 animate-scale overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardTitle className="text-center text-2xl">
              Progress Logged Successfully!
            </CardTitle>
            <CardDescription className="text-center">
              Great job tracking your academic progress today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-6 dark:bg-green-900">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 animate-bounce-slow" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">
                You earned {earnedPoints} points!
              </h3>
              <p className="text-muted-foreground">
                Keep up the good work to climb the leaderboard
              </p>
            </div>
            <div className="flex justify-center pt-4">
              <Badge
                variant="outline"
                className="text-lg px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-800 dark:text-green-200 animate-pulse"
              >
                New Total: {(user?.points || 0) + earnedPoints} points
              </Badge>
            </div>
            <div className="pt-4">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full animate-shimmer"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl relative">
      {showFullScreen && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/95 via-blue-900/90 to-purple-900/95 backdrop-blur-md z-50 flex flex-col items-center justify-center">
          <div className="absolute top-8 right-8 text-right">
            <div className="text-2xl font-light text-white/70">
              {formatDate(currentDateTime)}
            </div>
            <div className="text-lg font-light text-white/50">
              Hello, {user?.name || "Nikhil178-tech"}
            </div>
          </div>

          <div className="text-center space-y-8 max-w-xl w-full mx-auto p-8 rounded-xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
            {/* Timer Progress Ring */}
            <div className="relative mx-auto w-72 h-72">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <defs>
                  <linearGradient
                    id="gradient"
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
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - (282.7 * timerProgress) / 100}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-7xl font-bold text-white">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-white/70 text-xl mt-2">
                  {isBreak ? "Break Time" : "Focus Time"}
                </div>
              </div>
            </div>

            <div className="text-white text-2xl font-medium flex items-center justify-center gap-3 mt-4">
              {isBreak ? (
                <>
                  <Coffee className="h-6 w-6 text-green-400" /> Relax and
                  Recharge
                </>
              ) : (
                <>
                  <Zap className="h-6 w-6 text-yellow-400" /> Stay Focused
                </>
              )}
            </div>

            {/* Current Todo for Pomodoro */}
            {currentTodoForPomodoro && currentTodoForPomodoro !== "none" && (
              <div className="bg-white/10 p-6 rounded-lg border border-white/20 mt-6">
                <p className="text-white/70 text-sm uppercase tracking-wider mb-2">
                  Current Task:
                </p>
                <p className="text-white text-2xl font-medium">
                  {currentTodoForPomodoro}
                </p>
              </div>
            )}

            {/* Motivational Quote */}
            <div className="italic text-white/80 px-8 py-6 border-l-4 border-blue-500 bg-white/5 rounded-r-lg mt-8">
              <p className="text-xl">"{currentQuote}"</p>
            </div>

            <div className="flex gap-6 justify-center mt-8">
              {isTimerPaused ? (
                <Button
                  onClick={resumeTimer}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg rounded-xl"
                >
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={pauseTimer}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-6 text-lg rounded-xl"
                >
                  Pause
                </Button>
              )}
              <Button
                onClick={resetTimer}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg rounded-xl"
              >
                Exit
              </Button>
            </div>

            <div className="flex items-center justify-between text-white bg-white/10 p-6 rounded-lg mt-8">
              <div className="text-lg">
                Completed: <span className="font-bold">{pomodoroCount}</span>
              </div>
              <div className="text-lg">
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

        <Alert className="bg-primary/10 border-primary/20 animate-slide-in-right">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Earn points by logging your progress</AlertTitle>
          <AlertDescription>
            +5 for attendance, +10 for each subject, +15 for each completed
            todo, and +20 for each pomodoro session (adjusted by your custom
            timer settings).
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="attendance" className="w-full animate-fade-in">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="todos">Todo List</TabsTrigger>
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
                    onCheckedChange={(checked) =>
                      handleAttendanceToggle(checked as boolean)
                    }
                    className={`h-6 w-6 ${!attendance ? "animate-pulse" : ""} ${attendanceLocked ? "opacity-80" : ""}`}
                    disabled={attendanceLocked}
                  />
                  <Label htmlFor="attendance" className="text-base">
                    I attended lectures today
                  </Label>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {attendance ? (
                    <p className="text-green-500">
                      +5 points will be awarded for attendance
                    </p>
                  ) : (
                    <p>Mark attendance to earn 5 points</p>
                  )}
                </div>
                {attendanceLocked && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm">
                    <span className="text-primary">
                      Note: Once attendance is marked, it cannot be unmarked.
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
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle>Subjects Studied</CardTitle>
                </div>
                <CardDescription>
                  Select the subjects you studied today
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {sscSubjects.map((subject, index) => (
                    <div
                      key={subject}
                      className="flex items-center space-x-2 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <Checkbox
                        id={`subject-${subject}`}
                        checked={subjects.includes(subject)}
                        onCheckedChange={() => handleSubjectToggle(subject)}
                        disabled={subjectsLocked[subject]}
                        className={subjectsLocked[subject] ? "opacity-80" : ""}
                      />
                      <Label htmlFor={`subject-${subject}`}>{subject}</Label>
                      {subjectsLocked[subject] && (
                        <Badge
                          variant="outline"
                          className="ml-2 animate-pulse-slow"
                        >
                          Logged
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {subjects.length > 0 ? (
                    <p className="text-green-500">
                      +{subjects.length * 10} points will be awarded for
                      subjects
                    </p>
                  ) : (
                    <p>Select subjects to earn 10 points each</p>
                  )}
                </div>
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 rounded-md text-sm">
                  <span className="text-green-700 dark:text-green-400">
                    Note: Once a subject is marked as studied, it cannot be
                    unmarked.
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="todos">
            <Card className="border-orange-200 dark:border-orange-800 overflow-hidden hover:shadow-lg transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <div className="flex items-center gap-2">
                  <List className="h-5 w-5 text-primary" />
                  <CardTitle>Todo List</CardTitle>
                </div>
                <CardDescription>
                  Add and complete tasks to earn points
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
                  <Input
                    placeholder="Add a new todo..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </form>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {todos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No todos yet. Add some tasks to get started!
                    </div>
                  ) : (
                    todos.map((todo, index) => (
                      <div
                        key={todo.$id}
                        className={`flex items-center justify-between p-3 rounded-lg border animate-fade-in ${
                          todo.completed
                            ? "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800"
                            : ""
                        }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            id={`todo-${todo.$id}`}
                            checked={todo.completed}
                            onCheckedChange={() => handleToggleTodo(todo.$id)}
                            className={
                              todo.completed
                                ? "bg-orange-500 text-white border-orange-500"
                                : ""
                            }
                          />
                          <Label
                            htmlFor={`todo-${todo.$id}`}
                            className={`${todo.completed ? "line-through text-muted-foreground" : ""}`}
                          >
                            {todo.text}
                          </Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTodo(todo.$id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  {todos.filter((t) => t.completed).length > 0 ? (
                    <p className="text-green-500">
                      +{todos.filter((t) => t.completed).length * 15} points
                      will be awarded for completed todos
                    </p>
                  ) : (
                    <p>Complete todos to earn 15 points each</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4">
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium">Completed: </span>
                      <span className="text-sm">
                        {todos.filter((t) => t.completed).length} of{" "}
                        {todos.length}
                      </span>
                    </div>
                  </div>

                  {/* Timer Settings */}
                  <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pomodoro Timer Settings
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingTime(!isEditingTime)}
                        className="text-muted-foreground"
                      >
                        {isEditingTime ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {isEditingTime && (
                      <div className="space-y-4 mb-4 animate-fade-in">
                        <div>
                          <div className="flex justify-between">
                            <Label htmlFor="focus-minutes">
                              Focus Time: {focusMinutes} minutes
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((focusMinutes / 25) * 20)} points per
                              session
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleFocusMinutesChange(
                                  Math.max(5, focusMinutes - 5)
                                )
                              }
                              disabled={focusMinutes <= 5}
                              className="h-8 w-8 p-0"
                            >
                              -
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
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleFocusMinutesChange(
                                  Math.min(60, focusMinutes + 5)
                                )
                              }
                              disabled={focusMinutes >= 60}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="break-minutes">
                            Break Time: {breakMinutes} minutes
                          </Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleBreakMinutesChange(
                                  Math.max(1, breakMinutes - 1)
                                )
                              }
                              disabled={breakMinutes <= 1}
                              className="h-8 w-8 p-0"
                            >
                              -
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
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleBreakMinutesChange(
                                  Math.min(30, breakMinutes + 1)
                                )
                              }
                              disabled={breakMinutes >= 30}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Select
                        value={currentTodoForPomodoro}
                        onValueChange={setCurrentTodoForPomodoro}
                      >
                        <SelectTrigger className="w-full sm:w-[240px]">
                          <SelectValue placeholder="Select a task" />
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
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex-1"
                      >
                        <Timer className="h-4 w-4 mr-2" /> Start Pomodoro Timer
                      </Button>
                    </div>

                    {pomodoroCount > 0 && (
                      <div className="mt-3 text-sm text-green-600 dark:text-green-400">
                        You've completed {pomodoroCount} sessions earning{" "}
                        {calculatePomodoroPoints()} points!
                      </div>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="animate-slide-in-bottom border-blue-200 dark:border-blue-800 overflow-hidden hover:shadow-lg transition-all duration-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              Review your progress before submitting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <h3 className="font-medium">Attendance</h3>
              <p>
                {attendance
                  ? "Attended lectures today"
                  : "No attendance marked"}
              </p>
              <Separator />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">
                Subjects Studied ({subjects.length})
              </h3>
              {subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject, index) => (
                    <Badge
                      key={subject}
                      variant="outline"
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No subjects marked as studied
                </p>
              )}
              <Separator />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">
                Completed Todos ({todos.filter((t) => t.completed).length})
              </h3>
              {todos.filter((t) => t.completed).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {todos
                    .filter((t) => t.completed)
                    .map((todo, index) => (
                      <Badge
                        key={todo.$id}
                        variant="outline"
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {todo.text}
                      </Badge>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No todos marked as completed
                </p>
              )}
              <Separator />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Pomodoro Sessions</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <p>{pomodoroCount} sessions completed</p>
                <p>Focus time: {focusMinutes} minutes per session</p>
                <p>Points earned: {calculatePomodoroPoints()}</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Points to Earn:</span>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
                  {calculatePoints()} points
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6">
            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse"
              disabled={calculatePoints() === 0}
            >
              Submit Progress
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
