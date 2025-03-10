import React from "react";
import { Badge } from "@/components/ui/badge";
import { TaskStatusType, TaskStatus } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TaskStatusType;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusStyle = () => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
      case TaskStatus.NOT_STARTED:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200";
      case TaskStatus.DELAYED:
        return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <Badge variant="outline" className={cn(statusStyle, "rounded-full", className)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;
