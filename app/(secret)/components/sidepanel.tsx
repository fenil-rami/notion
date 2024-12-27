// @ts-nocheck
// components/SidePanelForm.tsx
import { api } from '@/convex/_generated/api';
import tType from '@/lib/taskType';
import tStatus from '@/lib/status';
import { useMutation, useQuery } from 'convex/react';
// import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getFormatedDate } from '@/lib/utils';


interface Task {
  _id?: string;
  title: string;
  taskType?: string;
  status: string;
  assignee: string;
  priority: string;
  desc: string;
  isNew?: boolean;
  when?: string;
  figma?: string;
  refLink?: string;
  createdBy?: string;
  comment?: string;
}

interface SidePanelFormProps {
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (task: Task) => void;
  docId: any;
}
// http://localhost:3000/documents/j57av6d8e8bthb4fkqsachqkt972nwfw/tasks

const SidePanelForm: React.FC<SidePanelFormProps> = ({ task, onClose, onSave, onUpdate, docId, setIsPanelOpen }) => {
  // const router = useRouter();
  // const { docId } = router.query; // Extracts docId from the URL
  // console.log("🚀 ~ docId:", docId)
  // console.log('task detailssss - -  ', task)

  const today = getFormatedDate(new Date())

  const [title, setTitle] = useState(task?.title || 'task name');
  const [assigneeName, setAssigneeName] = useState(task?.assignee || 'user 1');
  const [priority, setPriority] = useState(task?.priority || 'HIgh');
  const [status, setStatus] = useState(task?.status || 'New');
  const [desc, setDesc] = useState(task?.desc || 'Description');
  const [taskType, settaskType] = useState(task?.taskType || 'Bug');
  const [dueDate, setDueDate] = useState(task?.when || today);
  const [createdBy, setCreatedBy] = useState(task?.createdBy || 'self');
  const [figma, setFigma] = useState(task?.figma || 'https://figma.com/link');
  const [comment, setComment] = useState(task?.comment || 'comment');
  const [refLink, setRefLink] = useState(task?.refLink || 'https://ref.com/link');
  const [users, setUsers] = useState([] as any);

  const createTask = useMutation(api.task.createDocument);
  const archiveTask = useMutation(api.task.archive);
  const updateTask = useMutation(api.task.updateTask);
  const allUsers: any = useQuery(api.user.getAllUsers);
  // useEffect(() => {
  //   // Ensure router is ready before accessing the docId
  //   if (router.isReady) {
  //     console.log("🚀 ~ docId:", docId);
  //   }
  // }, [router.isReady, docId]);

  
  console.log('dueDate - ', task?.when)
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setAssigneeName(task.assignee);
      setPriority(task.priority);
      setStatus(task.status);
      setDesc(task.desc);
      setDueDate(task.when || '');
      setCreatedBy(task.createdBy || '');
      settaskType(task?.taskType || '');
      setComment(task?.comment || '');
      setFigma(task?.figma || '');
      setRefLink(task?.refLink || '');
    } else {
      // Reset form for new task creation
      setTitle('Title');
      setAssigneeName('User1');
      setPriority('High');
      setStatus('New');
      setDesc('Desc');
      setDueDate(today);
      setCreatedBy('Self');
      settaskType('Bug');
      setComment('Comment');
      setFigma('https://figma.com/link');
      setRefLink('https://ref.com/link');
    }
  }, [task]);
  // const documentId = params.documentId;

  useEffect(() => {
    if (allUsers?.length) {
      setUsers(allUsers)
    } else {
      setUsers([])
    }
  }, [allUsers])

  const handleSave = () => {
    // console.log("🚀 ~ handleSave ~ docId:", docId)
    if (!task) {
      createTask({
        title,
        assignee: assigneeName,
        priority,
        status,
        desc,
        when: dueDate,
        taskType,
        comment,
        docId,
        label: 'new',
        reporter: "reporter",
        figma,
        refLink

      }).then(() => {
        toast.success('Task created successfully!');
        setIsPanelOpen(false)
        // onSave();
      });
    } else if (task) {
      // console.log("🚀 ~ handleSave ~ task:", task)
      // @ts-ignore
      delete task._creationTime
      const updatedTask = {
        id: task?._id,
        title,
        assignee: assigneeName,
        priority,
        status,
        desc,
        when: dueDate,
        taskType,
        // docId,
        label: 'new',
        reporter: "reporter",
        figma,
        refLink,
        comment
      };
      // delete updatedTask._id
      // delete updatedTask?.assigneeName
      // console.log("🚀 ~ handleSave ~ updatedTask:", updatedTask)
      // @ts-ignore
      // delete updateTask.assigneeName
      updateTask(updatedTask).then(() => {
        toast.success('Task updated successfully!');
        setIsPanelOpen(false)
        // @ts-ignore
        onUpdate((prevTasks) =>
          prevTasks.map((task: any) =>
            task._id === updatedTask.id ? { ...task, ...updatedTask } : task
          )
        );
      });
    }
  };

  const deleteTask = (taskId: any) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      archiveTask({ id: taskId }).then(() => {
        toast.success('Task deleted successfully!');
        setIsPanelOpen(false)
      });
    }
  }

  return (
    <div className="fixed right-0 top-10 h-full w-1/3 bg-[#191919] text-white shadow-md overflow-y-scroll p-6">
      {/* Close Button */}
      <div className="flex justify-end mb-4">
        <button onClick={() => { setIsPanelOpen(false) }} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md text-[14px]">Close</button>
        {task?._id && <button onClick={() => { deleteTask(task._id) }} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md text-[14px] mx-2">Delete Task</button>}
      </div>

      <div className="mb-6">
        <input
          type="text"
          className="flex-1 bg-[#191919] font-semibold text-[24px] mb-3"
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="space-y-4">
          {/* Assignee Field */}
          <div className="flex items-center">
            <div className="w-1/3 text-gray-400 text-[14px] user-select-none transition-background duration-20 ease-in cursor-pointer flex items-center h-full w-full rounded-[4px] p-[0_6px] max-w-full">Assignee Name</div>
            {/* <input
              type="text"
              className="flex-1 bg-gray-700 p-2 rounded-md text-[14px]"
              placeholder="Enter assignee name"
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
            /> */}
            <select
              className="flex-1 bg-gray-700 p-2 rounded-md text-[14px] hover:bg-gray-600"
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
            >
              <option value="">Select Assignee</option>
              {users.length && users?.map((tt: any) => 
                <option value={tt?.familyName || tt?.givenName}>{tt?.familyName || tt?.givenName}</option>
              )}
            </select>
          </div>

          {/* Description Field */}
          <div className="flex items-center">
            <div className="w-1/3 text-gray-400 text-[14px]">Description</div>
            <textarea
              className="flex-1 bg-gray-700 p-2 rounded-md text-[14px] hover:bg-gray-600"
              placeholder="Add description..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            ></textarea>
          </div>

          {/* Due Date Field */}
          <div className="flex items-center">
            <div className="w-1/3 text-gray-400 text-[14px]">Due Date</div>
            <input
              type="date"
              className="flex-1 bg-gray-700 p-2 rounded-md text-[14px] hover:bg-gray-600"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Figma Link Field */}
          <div className="flex items-center">
            <div className="w-1/3 text-gray-400 text-[14px]">Figma Link</div>
            <input type="url"
              value={figma}
              onChange={(e) => setFigma(e.target.value)}
            className="flex-1 bg-gray-700 p-2 rounded-md text-[14px] hover:bg-gray-600" placeholder="Add Figma link" />
          </div>

          {/* Priority Field */}
          <div className="flex items-center">
            <div className="w-1/3 text-gray-400 text-[14px]">Priority</div>
            <select
              className="flex-1 bg-gray-700 p-2 rounded-md text-[14px] hover:bg-gray-600"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">Select Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center">
            <div className="w-1/3 text-gray-400 text-[14px]">Task Type</div>
            <select
              className="flex-1 bg-gray-700 p-2 rounded-md text-[14px] hover:bg-gray-600"
              value={taskType}
              onChange={(e) => settaskType(e.target.value)}
            >
              <option value="">Select Task Type</option>
              {tType.map(tt => 
                <option value={tt.Code}>{tt.Name}</option>
              )}
            </select>
          </div>
  
          {/* Status Field */}
          <div className="flex items-center">
            <div className="w-1/3 text-gray-400 text-[14px]">Status</div>
            <select
              className="flex-1 bg-gray-700 p-2 rounded-md text-[14px] hover:bg-gray-600"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="New">New</option>
              {tStatus.map(tt => 
                <option value={tt.Code}>{tt.Name}</option>
              )}
            </select>
          </div>

          {/* Reference Link Field */}
          <div className="flex items-center">
            <div className="w-1/3 text-gray-400 text-[14px]">Reference Link</div>
            <input type="url" 
              value={refLink}
              onChange={(e) => setRefLink(e.target.value)}
            className="flex-1 bg-gray-700 p-2 rounded-md text-[14px] hover:bg-gray-600" placeholder="Add reference link" />
          </div>
        </div>
      </div>

      {/* Comment Section */}
      <div className="mt-6">
        <div className="text-lg mb-2 font-semibold text-[24px]">Add a Comment</div>
        <textarea className="w-full bg-gray-700 p-3 rounded-md text-[14px] hover:bg-gray-600" placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        ></textarea>
        {/* <div className="flex justify-end mt-3">
          <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-[14px]">Send</button>
        </div> */}
      </div>

      {/* Tiptap Editor */}
      {/* <div className="mt-6"> */}
      {/* <div className="text-lg mb-2 font-semibold text-[24px]">Integration Description</div> */}
      {/* <Tiptap /> */}
      {/* </div> */}

      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%', padding: '1em' }}>
        <button
          type="button"
          style={{ border: '2px solid black', padding: '.5em 3em', borderRadius: '5px' }}
          onClick={handleSave}
        >
          {!task ? 'Create' : 'Update'}
        </button>
      </div>
    </div>
  );
};

export default SidePanelForm;
