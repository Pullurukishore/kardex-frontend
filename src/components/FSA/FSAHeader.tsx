"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, Clock, RefreshCw, Download, TrendingUp } from "lucide-react";

interface FSAHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
}

export default function FSAHeader({ isRefreshing, onRefresh }: FSAHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Field Service Analytics
              </h1>
              <p className="text-slate-600 font-medium">Comprehensive Field Operations & Performance Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last updated: {new Date().toLocaleTimeString()}
              {isRefreshing && <RefreshCw className="w-4 h-4 ml-1 animate-spin" />}
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Live Data
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button
              onClick={onRefresh}
              variant="default"
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 flex items-center gap-2"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
