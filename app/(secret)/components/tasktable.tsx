// @ts-nocheck
// components/TaskTable.tsx
import tType from '@/lib/taskType';
import tStatus from '@/lib/status';
import { useState } from 'react';
import SidePanelForm from './sidepanel';

// Define the type for a task
interface Task {
  _id: string;
  title: string;
  taskType: string;
  status: string;
  assignee: string;
  priority: string;
  figma?: string;
  refLink?: string;
  comment?: string;
  isNew?: boolean;
}

export default function TaskTable(props: any) {
  // console.log("🚀 ~ TaskTable ~ props: >>>>", props.Tasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);


  const openSidePanel = (task: Task) => {
    console.log("Opening side panel", task)
    setSelectedTask(task);
    setIsPanelOpen(true)
    // Logic to open the side panel (can be a modal or a drawer)
  };

  return (
    <>
      {/* Table Container */}
      <div className="relative w-full overflow-hidden border border-gray-700 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <TableHeader />
          </thead>
          <tbody>
            {(props.Tasks || []).map((task: Task) => (
              <TaskRow key={task._id} task={task} isNew={false} openSidePanel={openSidePanel} setIsPanelOpen={setIsPanelOpen} />
            ))}
            <TaskRow key="NEW_TASK_CLONE" isNew={true} task={null} openSidePanel={openSidePanel} setIsPanelOpen={setIsPanelOpen} />
          </tbody>
        </table>
      </div>

      {/* Side Panel for Task Details, covering 30% of the screen width */}
      {isPanelOpen && <SidePanelForm task={selectedTask} docId={props.docId} onUpdate={props.onUpdate} setIsPanelOpen={setIsPanelOpen} />}
    </>
  );
}

// Header Component for the Table
function TableHeader() {
  return (
    <tr className="flex items-center bg-gray-800 text-gray-400">
      <th className="flex items-center w-1/3 p-2 border-r border-gray-700 font-medium">
        <input type="checkbox" className="accent-blue-500 mr-2" />
        <div className="flex items-center gap-2">
          <span className="font-medium whitespace-nowrap overflow-hidden overflow-ellipsis">
            Name
          </span>
        </div>
      </th>
      <th className="w-1/4 p-2 border-r border-gray-700 font-medium">
        taskType
      </th>
      <th className="w-1/4 p-2 border-r border-gray-700 font-medium">
        Status
      </th>
      <th className="w-1/5 p-2 border-r border-gray-700 font-medium">
        Assignee
      </th>
      <th className="w-1/5 p-2 border-r border-gray-700 font-medium">
        Priority
      </th>
    </tr>
  );
}
// Name, , Status, Assignee, taskType

// Define the props for the TaskRow component
interface TaskRowProps {
  task: Task;
  openSidePanel: (task: Task) => void;
  isNew: boolean;
  setIsPanelOpen: any;
}

function TaskRow({ task, openSidePanel, isNew, setIsPanelOpen }: TaskRowProps) {
  console.log("🚀 ~ TaskRow ~ task:", task)
  // console.log("🚀 ~ TaskRow ~ key:", isNew)
  // console.log("TaskRow ~ task:", { tasktitle });
  return (
    <>
      {
        !isNew ?
          <tr
            className="flex items-center border-b border-gray-700 cursor-pointer"
            onClick={() => openSidePanel(task)}
          >
            <td className="flex items-center w-1/3 p-2 border-r border-gray-700">
              <input type="checkbox" className="accent-blue-500 mr-2" />
              <div className="flex items-center gap-2">
                <span className="inline-flex justify-center items-center w-5 h-5 rounded-sm bg-gray-700">
                  {/* Placeholder Icon */}
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 16 16">
                    <path d="M4.35645 15.4678H11.6367C13.0996 15.4678 13.8584 14.6953 13.8584 13.2256V7.02539C13.8584 6.0752 13.7354 5.6377 13.1406 5.03613L9.55176 1.38574C8.97754 0.804688 8.50586 0.667969 7.65137 0.667969H4.35645C2.89355 0.667969 2.13477 1.44043 2.13477 2.91016V13.2256C2.13477 14.7021 2.89355 15.4678 4.35645 15.4678ZM4.46582 14.1279C3.80273 14.1279 3.47461 13.7793 3.47461 13.1436V2.99219C3.47461 2.36328 3.80273 2.00781 4.46582 2.00781H7.37793V5.75391C7.37793 6.73145 7.86328 7.20312 8.83398 7.20312H12.5186V13.1436C12.5186 13.7793 12.1836 14.1279 11.5205 14.1279H4.46582ZM8.95703 6.02734C8.67676 6.02734 8.56055 5.9043 8.56055 5.62402V2.19238L12.334 6.02734H8.95703Z"></path>
                  </svg>
                </span>
                <span className="font-medium whitespace-nowrap overflow-hidden overflow-ellipsis">
                  {task?.title}
                </span>
              </div>
            </td>
            <td className="w-1/4 p-2 border-r border-gray-700">
              <span
                className={`${tType.find(item => item.Code === task.taskType)?.CSS || "bg-gray-200"}`
                }
              >
                {task.taskType}
              </span>
            </td>
            <td className="w-1/4 p-2 border-r border-gray-700">
              <span className={`${tStatus.find(item => item.Code == task.status)?.CSS}`}>{task.status}</span>
            </td>
            <td className="w-1/5 p-2 border-r border-gray-700">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500"></span>
                -- {task?.assignee}
              </div>
            </td>
            <td className="w-1/5 p-2 border-r border-gray-700">{task.priority}</td>
          </tr> :
          <tr
            className="flex items-center border-b border-gray-700 cursor-pointer"
            onClick={() => openSidePanel(task)}
          >
            <td className="flex items-center w-1/3 p-2 border-r border-gray-700"> New Task</td>
          </tr>

      }
    </>
  );
}