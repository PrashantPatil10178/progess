import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle,
  Trophy,
  BookOpen,
  Calendar,
  Check,
  Target,
  Flame,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
          <div className="container px-4 md:px-6 h-full flex items-center">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-2"
                >
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500 animate-pulse">
                    Track Your Academic Progress
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Log your daily academic activities, earn points, and compete
                    with your classmates. Stay motivated and achieve your
                    academic goals.
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col gap-2 min-[400px]:flex-row"
                >
                  <Link to="/dashboard">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 animate-bounce-slow"
                    >
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center"
              >
                <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square overflow-hidden rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-green-500/20 z-10"></div>
                  <svg
                    viewBox="0 0 600 600"
                    className="object-cover w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      width="600"
                      height="600"
                      fill="#3b82f6"
                      opacity="0.1"
                    />
                    <g transform="translate(100, 100)">
                      {/* Student studying illustration */}
                      <rect
                        x="50"
                        y="150"
                        width="300"
                        height="200"
                        rx="10"
                        fill="#ffffff"
                      />
                      <rect
                        x="80"
                        y="180"
                        width="240"
                        height="30"
                        rx="5"
                        fill="#e0e7ff"
                      />
                      <rect
                        x="80"
                        y="230"
                        width="180"
                        height="30"
                        rx="5"
                        fill="#e0e7ff"
                      />
                      <rect
                        x="80"
                        y="280"
                        width="200"
                        height="30"
                        rx="5"
                        fill="#e0e7ff"
                      />
                      <circle cx="400" cy="200" r="50" fill="#4f46e5" />
                      <path
                        d="M400,230 Q420,250 400,270 Q380,250 400,230"
                        fill="#ffffff"
                      />
                      <path
                        d="M380,190 Q390,180 400,190 Q410,180 420,190"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    </g>
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 300 300"
                      to="360 300 300"
                      dur="60s"
                      repeatCount="indefinite"
                    />
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 z-20">
                    <p className="text-white font-medium">10th SSC Students</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center space-y-4 text-center"
            >
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm dark:bg-blue-900">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Everything You Need to Excel
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our platform provides all the tools you need to track your
                  academic progress and stay motivated.
                </p>
              </div>
            </motion.div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                viewport={{ once: true }}
                className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm bg-white dark:bg-gray-950 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Track Attendance</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Mark your daily lecture attendance and earn points.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm bg-white dark:bg-gray-950 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="rounded-full bg-green-100 p-4 dark:bg-green-900">
                  <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold">Log Subjects</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Record which subjects you've studied each day.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm bg-white dark:bg-gray-950 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="rounded-full bg-orange-100 p-4 dark:bg-orange-900">
                  <Check className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold">Track Assignments</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Keep track of your homework and assignments.
                </p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                viewport={{ once: true }}
                className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm bg-white dark:bg-gray-950 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="rounded-full bg-purple-100 p-4 dark:bg-purple-900">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">Test Preparation</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Track your exam preparation progress.
                </p>
              </motion.div>

              {/* Feature 5 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm bg-white dark:bg-gray-950 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="rounded-full bg-red-100 p-4 dark:bg-red-900">
                  <Flame className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold">Earn Points</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Earn points for your academic activities.
                </p>
              </motion.div>

              {/* Feature 6 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm bg-white dark:bg-gray-950 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="rounded-full bg-yellow-100 p-4 dark:bg-yellow-900">
                  <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold">Leaderboard</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Compete with your classmates.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Leaderboard Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-950 dark:to-blue-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex items-center justify-center order-2 lg:order-1"
              >
                <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square overflow-hidden rounded-xl shadow-2xl transform hover:rotate-2 transition-transform duration-300">
                  <svg
                    viewBox="0 0 600 600"
                    className="object-cover w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      width="600"
                      height="600"
                      fill="#4f46e5"
                      opacity="0.1"
                    />
                    {/* Leaderboard illustration */}
                    <rect
                      x="100"
                      y="100"
                      width="400"
                      height="400"
                      rx="20"
                      fill="#ffffff"
                    />
                    <rect
                      x="150"
                      y="150"
                      width="300"
                      height="50"
                      rx="10"
                      fill="#818cf8"
                    />
                    <rect
                      x="150"
                      y="220"
                      width="300"
                      height="40"
                      rx="8"
                      fill="#c7d2fe"
                    />
                    <rect
                      x="150"
                      y="280"
                      width="300"
                      height="40"
                      rx="8"
                      fill="#c7d2fe"
                    />
                    <rect
                      x="150"
                      y="340"
                      width="300"
                      height="40"
                      rx="8"
                      fill="#c7d2fe"
                    />
                    <rect
                      x="150"
                      y="400"
                      width="300"
                      height="40"
                      rx="8"
                      fill="#c7d2fe"
                    />
                    <circle cx="180" cy="240" r="15" fill="#f59e0b" />
                    <circle cx="180" cy="300" r="15" fill="#94a3b8" />
                    <circle cx="180" cy="360" r="15" fill="#a855f7" />
                    <circle cx="180" cy="420" r="15" fill="#10b981" />
                  </svg>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col justify-center space-y-4 order-1 lg:order-2"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Compete with Your Classmates
                  </h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Join the leaderboard and see how you rank among your peers.
                    Earn badges and achievements as you progress.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link to="/leaderboard">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      View Leaderboard <Trophy className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Progress Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[400px_1fr] lg:gap-12 xl:grid-cols-[600px_1fr]">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col justify-center space-y-4"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Track Your Daily Progress
                  </h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Log your daily academic activities and see your progress
                    over time. Stay motivated with streaks and achievements.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link to="/progress">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      Log Progress <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex items-center justify-center"
              >
                <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square overflow-hidden rounded-xl shadow-2xl transform hover:rotate-2 transition-transform duration-300">
                  <svg
                    viewBox="0 0 600 600"
                    className="object-cover w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      width="600"
                      height="600"
                      fill="#10b981"
                      opacity="0.1"
                    />
                    {/* Progress chart illustration */}
                    <rect
                      x="100"
                      y="200"
                      width="400"
                      height="300"
                      rx="10"
                      fill="#ffffff"
                    />
                    <line
                      x1="150"
                      y1="450"
                      x2="450"
                      y2="450"
                      stroke="#6ee7b7"
                      strokeWidth="2"
                    />
                    <line
                      x1="150"
                      y1="450"
                      x2="150"
                      y2="250"
                      stroke="#6ee7b7"
                      strokeWidth="2"
                    />
                    <path
                      d="M150,400 Q200,350 250,380 Q300,410 350,320 Q400,280 450,350"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="4"
                    />
                    <circle cx="150" cy="400" r="5" fill="#3b82f6" />
                    <circle cx="250" cy="380" r="5" fill="#3b82f6" />
                    <circle cx="350" cy="320" r="5" fill="#3b82f6" />
                    <circle cx="450" cy="350" r="5" fill="#3b82f6" />
                    <text
                      x="150"
                      y="480"
                      fontFamily="Arial"
                      fontSize="14"
                      fill="#64748b"
                    >
                      Mon
                    </text>
                    <text
                      x="250"
                      y="480"
                      fontFamily="Arial"
                      fontSize="14"
                      fill="#64748b"
                    >
                      Tue
                    </text>
                    <text
                      x="350"
                      y="480"
                      fontFamily="Arial"
                      fontSize="14"
                      fill="#64748b"
                    >
                      Wed
                    </text>
                    <text
                      x="450"
                      y="480"
                      fontFamily="Arial"
                      fontSize="14"
                      fill="#64748b"
                    >
                      Thu
                    </text>
                  </svg>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center space-y-4 text-center"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Ready to Start Tracking?
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Join thousands of students who are already improving their
                  academic performance.
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col gap-2 min-[400px]:flex-row"
              >
                <Link to="/dashboard">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 animate-pulse"
                  >
                    Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <p className="text-gray-500 dark:text-gray-400">
                © 2025 Student Progress Tracker. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
