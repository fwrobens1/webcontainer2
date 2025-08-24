import React from 'react';
import { CheckCircle, Circle, Clock, Play, Code, FolderPlus } from 'lucide-react';
import { Step, StepType } from '../types';

interface StepsPanelProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

function getStepIcon(type: StepType, status: string) {
  if (status === 'completed') return CheckCircle;
  if (status === 'in-progress') return Clock;
  
  switch (type) {
    case StepType.CreateFile:
      return Code;
    case StepType.CreateFolder:
      return FolderPlus;
    case StepType.RunScript:
      return Play;
    default:
      return Circle;
  }
}

function getStepColor(type: StepType, status: string) {
  if (status === 'completed') return 'text-green-400';
  if (status === 'in-progress') return 'text-blue-400';
  
  switch (type) {
    case StepType.CreateFile:
      return 'text-purple-400';
    case StepType.CreateFolder:
      return 'text-yellow-400';
    case StepType.RunScript:
      return 'text-orange-400';
    default:
      return 'text-gray-400';
  }
}

export function StepsPanel({ steps, currentStep, onStepClick }: StepsPanelProps) {
  return (
    <div className="h-full bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <h2 className="text-lg font-semibold text-white">Build Steps</h2>
        <p className="text-sm text-gray-400 mt-1">
          {steps.filter(s => s.status === 'completed').length} of {steps.length} completed
        </p>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Circle className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No steps yet</p>
            <p className="text-gray-500 text-xs mt-1">Steps will appear as AI processes your request</p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => {
              const IconComponent = getStepIcon(step.type, step.status);
              const iconColor = getStepColor(step.type, step.status);
              const isActive = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? 'bg-blue-600/10 border-blue-600/30'
                      : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800'
                  }`}
                  onClick={() => onStepClick(step.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 ${iconColor}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-white text-sm truncate">
                          {step.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          #{index + 1}
                        </span>
                      </div>
                      {step.description && (
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {step.description}
                        </p>
                      )}
                      {step.path && (
                        <p className="text-xs text-blue-400 mt-1 font-mono">
                          {step.path}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}