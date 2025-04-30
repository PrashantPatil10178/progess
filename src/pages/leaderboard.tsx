import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import {
  getLeaderboard,
  getMonthlyLeaderboard,
  getWeeklyLeaderboard,
  getUserRank,
} from "@/services/leaderboard.service";

interface Student {
  $id: string;
  name: string;
  profilePicture?: string;
  points: number;
  streak?: number;
  badges?: string[];
  rank?: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<Student[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<Student[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<Student[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all-time");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);

        const allTimeData = await getLeaderboard(10);
        const formattedData = allTimeData.map((doc: any) => ({
          $id: doc.$id,
          name: doc.name,
          profilePicture: doc.profilePicture,
          points: doc.points,
          streak: doc.streak,
          badges: doc.badges,
          rank: doc.rank,
        }));
        setLeaderboardData(formattedData);

        const monthlyData = await getMonthlyLeaderboard(10);
        const formattedMonthlyData = monthlyData.map((doc: any) => ({
          $id: doc.$id || "",
          name: doc.name || "Unknown",
          profilePicture: doc.profilePicture || "",
          points: doc.points || 0,
          streak: doc.streak || 0,
          badges: doc.badges || [],
          rank: doc.rank || 0,
        }));
        setMonthlyLeaderboard(formattedMonthlyData);

        const weeklyData = await getWeeklyLeaderboard(10);
        const formattedWeeklyData = weeklyData.map((doc: any) => ({
          $id: doc.$id || "",
          name: doc.name || "Unknown",
          profilePicture: doc.profilePicture || "",
          points: doc.points || 0,
          streak: doc.streak || 0,
          badges: doc.badges || [],
          rank: doc.rank || 0,
        }));
        setWeeklyLeaderboard(formattedWeeklyData);

        if (user) {
          const rank = await getUserRank(user.$id);
          setUserRank(rank);
        }
      } catch (err) {
        console.error("Error fetching leaderboard data", err);
        setError("Failed to load leaderboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [user]);

  const getLeaderIcon = (position: number) => {
    switch (position) {
      case 0:
        return (
          <Crown className="h-5 w-5 text-yellow-500 animate-bounce-slow" />
        );
      case 1:
        return <Medal className="h-5 w-5 text-gray-400 animate-bounce-slow" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-700 animate-bounce-slow" />;
      default:
        return null;
    }
  };

  const getPositionClass = (position: number) => {
    switch (position) {
      case 0:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-300/20 border-yellow-500/50";
      case 1:
        return "bg-gradient-to-r from-gray-300/20 to-gray-100/20 border-gray-400/50";
      case 2:
        return "bg-gradient-to-r from-amber-700/20 to-amber-500/20 border-amber-700/50";
      default:
        return "";
    }
  };

  const renderLeaderboard = (data: Student[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No leaderboard data available yet.
          </p>
        </div>
      );
    }

    return (
      <>
        <Card className="border-blue-200 dark:border-blue-800 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4">
            <CardTitle className="text-lg">Top Performers</CardTitle>
            <CardDescription className="text-sm">
              Highest points earners
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="grid gap-3">
              {data.slice(0, 3).map((student, index) => (
                <div
                  key={student.$id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${getPositionClass(index)}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    {getLeaderIcon(index)}
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-primary">
                    <AvatarImage
                      src={student.profilePicture}
                      alt={student.name}
                    />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">
                      {user && student.$id === user.$id
                        ? `You - ${student.name}`
                        : student.name}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {index === 0 && (
                        <Badge className="text-xs bg-yellow-500/20 text-yellow-800 dark:text-yellow-200">
                          Champion
                        </Badge>
                      )}
                      {index === 1 && (
                        <Badge className="text-xs bg-gray-400/20 text-gray-800 dark:text-gray-200">
                          Runner Up
                        </Badge>
                      )}
                      {index === 2 && (
                        <Badge className="text-xs bg-amber-700/20 text-amber-800 dark:text-amber-200">
                          Third Place
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
                      {student.points}
                    </div>
                    <div className="text-xs text-muted-foreground">points</div>
                    {student.streak && student.streak > 0 && (
                      <div className="text-xs mt-1">
                        🔥 {student.streak} days
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {data.length > 3 && (
          <>
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Other Rankings
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {data.slice(3).map((student, index) => (
                <div
                  key={student.$id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    user && student.$id === user.$id
                      ? "bg-primary/5 border-primary/30"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                    <span className="text-xs font-medium">{index + 4}</span>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={student.profilePicture}
                      alt={student.name}
                    />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-1 truncate">
                      {user && student.$id === user.$id
                        ? `You - ${student.name}`
                        : student.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{student.points}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {user && userRank && userRank > 10 && (
          <div className="mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20">
                <span className="text-xs font-medium">{userRank}</span>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profilePicture} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium flex items-center gap-1 truncate">
                  {`You - ${user.name}`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">{user.points || 0}</div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-bold">Loading leaderboard...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-4 px-3">
      <div className="grid gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
            Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground">
            See how you rank among others
          </p>
        </div>

        <Tabs
          defaultValue="all-time"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all-time" className="text-xs">
              All Time
            </TabsTrigger>
            <TabsTrigger value="this-month" className="text-xs">
              Month
            </TabsTrigger>
            <TabsTrigger value="this-week" className="text-xs">
              Week
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-time" className="space-y-4">
            {renderLeaderboard(leaderboardData)}
          </TabsContent>

          <TabsContent value="this-month" className="space-y-4">
            {monthlyLeaderboard.length > 0 ? (
              renderLeaderboard(monthlyLeaderboard)
            ) : (
              <Card className="border-dashed">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4">
                  <CardTitle className="text-lg">This Month</CardTitle>
                  <CardDescription className="text-sm">
                    Monthly rankings coming soon
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-40 text-center p-4">
                  <Trophy className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Monthly leaderboard data is being calculated
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="this-week" className="space-y-4">
            {weeklyLeaderboard.length > 0 ? (
              renderLeaderboard(weeklyLeaderboard)
            ) : (
              <Card className="border-dashed">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4">
                  <CardTitle className="text-lg">This Week</CardTitle>
                  <CardDescription className="text-sm">
                    Weekly rankings coming soon
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-40 text-center p-4">
                  <Trophy className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Weekly leaderboard data is being calculated
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
