"use client";

import { useEffect, useState, useRef } from "react";
import { useSearch } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Edit,
  Flame,
  Medal,
  Target,
  Phone,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar",
  "Akola",
  "Amravati",
  "Aurangabad",
  "Beed",
  "Bhandara",
  "Buldhana",
  "Chandrapur",
  "Dhule",
  "Gadchiroli",
  "Gondia",
  "Hingoli",
  "Jalgaon",
  "Jalna",
  "Kolhapur",
  "Latur",
  "Mumbai City",
  "Mumbai Suburban",
  "Nagpur",
  "Nanded",
  "Nandurbar",
  "Nashik",
  "Osmanabad",
  "Palghar",
  "Parbhani",
  "Pune",
  "Raigad",
  "Ratnagiri",
  "Sangli",
  "Satara",
  "Sindhudurg",
  "Solapur",
  "Thane",
  "Wardha",
  "Washim",
  "Yavatmal",
];

interface SearchParams {
  from?: string;
  requirePhone?: string;
}

export default function ProfilePage() {
  const search: SearchParams = useSearch({
    from: undefined,
    strict: false,
  });
  console.log("Search params:", search);
  const [requirePhone, setRequirePhone] = useState(
    search.requirePhone === "true"
  );
  const { user, updateUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [Class, setClass] = useState("");
  const [District, setDistrict] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setClass(user.Class || "");
      setDistrict(user.District || "");
      setPhoneNo(user.phoneNo || "");
      setIsLoading(false);

      // Auto-enable edit mode if phone is required
      if (requirePhone && !user.phoneNo) {
        setIsEditing(true);
        setTimeout(() => {
          phoneInputRef.current?.focus();
        }, 100);
      }
    }
  }, [user, requirePhone]);

  const validatePhoneNumber = (number: string) => {
    if (!/^\d*$/.test(number)) {
      return "Phone number should contain only digits";
    }
    if (number.length > 0 && number.length !== 10) {
      return "Phone number must be 10 digits";
    }
    return "";
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNo(value);
    setPhoneError(validatePhoneNumber(value));
  };

  const handleSaveProfile = async () => {
    const phoneValidationError = validatePhoneNumber(phoneNo);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }

    setIsSaving(true);
    try {
      await updateUserData({
        name,
        Class,
        District,
        phoneNo,
      });
      setIsEditing(false);
      setPhoneError("");
      // Remove the phone requirement banner if phone was added
      if (requirePhone && phoneNo) {
        setRequirePhone(false);
      }
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-2xl font-bold animate-pulse">
            Loading profile...
          </h2>
          <p className="text-muted-foreground">Retrieving your information</p>
        </div>
      </div>
    );
  }

  const statistics = {
    daysActive: 0,
    totalPoints: user?.points || 0,
    assignmentsCompleted: 0,
    subjectsStudied: 0,
    testPrepHours: 0,
    currentStreak: user?.streak || 0,
    bestStreak: 0,
    rank: 0,
  };

  return (
    <div className="container py-8">
      <div className="grid gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-in-left">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
            My Profile
          </h1>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 animate-fade-in"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Notification Banner for Required Phone */}
        {requirePhone && !phoneNo && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 animate-bounce-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-bold">Action required!</span> Please
                  complete your profile by adding your phone number to continue
                  using the application.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 animate-scale border-blue-200 dark:border-blue-800 overflow-hidden hover:shadow-lg transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center p-6">
              <Avatar className="h-24 w-24 mb-4 border-4 border-primary animate-glow">
                <AvatarFallback className="text-2xl">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              {isEditing ? (
                <div className="w-full space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      ref={phoneInputRef}
                      value={phoneNo}
                      onChange={handlePhoneChange}
                      placeholder="Enter 10 digit phone number"
                      type="tel"
                      maxLength={10}
                      className={cn(phoneError && "border-red-500")}
                    />
                    {phoneError && (
                      <div className="flex items-center text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {phoneError}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select value={Class} onValueChange={setClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your class" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (grade) => (
                            <SelectItem key={grade} value={grade.toString()}>
                              Class {grade}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Select value={District} onValueChange={setDistrict}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your district" />
                      </SelectTrigger>
                      <SelectContent>
                        {MAHARASHTRA_DISTRICTS.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold">{name}</h2>
                  <div className="flex flex-col items-center mt-2 space-y-1">
                    {phoneNo && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {phoneNo}
                      </div>
                    )}
                    {Class && (
                      <p className="text-sm text-muted-foreground">
                        Class {Class}
                      </p>
                    )}
                    {District && (
                      <p className="text-sm text-muted-foreground">
                        {District}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 w-full">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Total Points</span>
                      <span className="font-medium">
                        {statistics.totalPoints}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        (statistics.totalPoints / 500) * 100,
                        100
                      )}
                      className="h-2 animate-shimmer"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.floor((statistics.totalPoints / 500) * 100)}% to
                      next level (500 points)
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-between bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={!!phoneError || isSaving}
                  className={cn(
                    "bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600",
                    (phoneError || isSaving) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card className="md:col-span-2 animate-slide-in-right border-blue-200 dark:border-blue-800 overflow-hidden hover:shadow-lg transition-all duration-200">
            <Tabs defaultValue="statistics">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <div className="flex items-center justify-between">
                  <CardTitle>Student Progress</CardTitle>
                  <TabsList>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                    <TabsTrigger value="badges">Badges</TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>
                  Track your academic journey and achievements
                </CardDescription>
              </CardHeader>

              <TabsContent value="statistics">
                <CardContent className="p-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex items-center gap-4 animate-fade-in">
                      <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Days Active
                        </div>
                        <div className="text-2xl font-bold">
                          {statistics.daysActive}
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-4 animate-fade-in"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Assignments Completed
                        </div>
                        <div className="text-2xl font-bold">
                          {statistics.assignmentsCompleted}
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-4 animate-fade-in"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                        <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Subjects Studied
                        </div>
                        <div className="text-2xl font-bold">
                          {statistics.subjectsStudied}
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-4 animate-fade-in"
                      style={{ animationDelay: "0.3s" }}
                    >
                      <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                        <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Test Prep Hours
                        </div>
                        <div className="text-2xl font-bold">
                          {statistics.testPrepHours}
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-4 animate-fade-in"
                      style={{ animationDelay: "0.4s" }}
                    >
                      <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                        <Flame className="h-5 w-5 text-red-600 dark:text-red-400 animate-bounce-slow" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Current Streak
                        </div>
                        <div className="text-2xl font-bold">
                          {statistics.currentStreak} days
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-4 animate-fade-in"
                      style={{ animationDelay: "0.5s" }}
                    >
                      <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                        <Medal className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Best Streak
                        </div>
                        <div className="text-2xl font-bold">
                          {statistics.bestStreak} days
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="badges">
                <CardContent className="p-6">
                  {user?.badges?.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {user.badges.map((badge, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center text-center p-4 rounded-lg border animate-scale bg-primary/5 border-primary/30"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="rounded-full p-3 bg-primary/10">
                            <Award className="h-6 w-6 text-primary animate-bounce-slow" />
                          </div>
                          <div className="mt-2 font-medium">{badge}</div>
                          <Badge
                            variant="outline"
                            className="mt-2 text-xs bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-800 dark:text-green-200 animate-pulse"
                          >
                            Earned
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No badges earned yet. Keep learning to earn your first
                        badge!
                      </p>
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
