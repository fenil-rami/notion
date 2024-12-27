// @ts-nocheck
"use client";

import TaskTable from "@/app/(secret)/components/tasktable";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import useSubscription from "@/hooks/use-subscription";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "react-quill/dist/quill.snow.css"; // Import Quill styles

import { toast } from "sonner";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface DocumentIdPageProps {
  params: {
    documentId: Id<"documents">;
  };
}

const TaskPage = ({ params }: DocumentIdPageProps) => {
  const { resolvedTheme } = useTheme();
  const createTask = useMutation(api.task.createDocument);
  const updateTask = useMutation(api.task.updateTask);
  const removeTask = useMutation(api.task.remove);
  const { user } = useUser();
  const router = useRouter();

  const documentId = params.documentId;

  const createDocument = useMutation(api.document.createDocument);

  const users = useQuery(api.user.getAllUsers);

  const taskList = useQuery(api.task.getTasksByDoc, {
    docId: documentId, // Pass the required argument here
  });

  const documents = useQuery(api.document.getAllDocuments);
  const { isLoading, plan } = useSubscription(user?.emailAddresses[0]?.emailAddress!);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [taskName, setTaskName] = useState("untitled");
  const [taskId, setTaskId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [reporter, setReporter] = useState("");
  const [when, setWhen] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [tasks, setTasks] = useState([{ name: "Add new", isNew: true }]);
  const now = new Date();

  const descriptionRef = useRef(description);

  // Update the state value with a slight delay to avoid re-rendering too frequently
  useEffect(() => {
    const handler = setTimeout(() => {
      setDescription(descriptionRef.current);
    }, 300); // 300ms delay
    return () => {
      clearTimeout(handler);
    };
  }, [descriptionRef.current]);

  const handleDescriptionChange = (value: any) => {
    descriptionRef.current = value;
    // Save content to database on change
    if (selectedTask?._id) {
      updateData();
    } else {
      saveData();
    }
  };

  const RichTextEditor = () => {
    return (
      <div style={{ width: "90%", height: "30vh" }}>
        <ReactQuill
          theme='snow'
          value={descriptionRef.current || description}
          onChange={handleDescriptionChange}
          style={{ height: "60%" }}
        />
      </div>
    );
  };

  useEffect(() => {
    // console.log("🚀 ~ useEffect ~ taskList mihi:", taskList)
    if (Array.isArray(taskList)) {
      // @ts-ignore
      setTasks(taskList);
    } else {
      console.error("taskList is not an iterable array:", taskList);
    }
  }, [taskList]);

  const onUpdate = async () => {
    // console.log("Calling .....")
    try {
      // Show a loading state or a message to indicate the update process is happening
      // setIsLoading(true);

      // Ensure documentId is available before proceeding
      if (!documentId) {
        toast.error("Document ID is missing. Unable to fetch tasks.");
        // setIsLoading(false);
        return;
      }

      // Fetch tasks related to the given document ID
      const taskList = await useQuery(api.task.getTasksByDoc, {
        docId: documentId, // Pass the required argument here
      });
      // console.log("🚀 ~ onUpdate ~ taskList:", taskList)
      // Handle if the taskList is empty or undefined
      if (!taskList) {
        toast.warning("No tasks found for the given document ID.");
      } else {
        // Update the state with the retrieved task list
        setTasks(taskList);
      }

      // Display a success message
      toast.success("Tasks successfully updated.");
    } catch (error) {
      // Handle errors gracefully
      console.error("Error updating tasks:", error);
      toast.error("Failed to update tasks. Please try again.");
    } finally {
      // Ensure loading state is removed once the process is done
      // setIsLoading(false);
    }
  };

  const onCreateDocument = () => {
    if (documents?.length && documents.length >= 3 && plan === "Free") {
      toast.error("You can only create 3 documents in the free plan");
      return;
    }

    const promise = createDocument({
      title: "Untitled",
    }).then((docId) => router.push(`/documents/${docId}`));

    toast.promise(promise, {
      loading: "Creating a new blank...",
      success: "Created a new blank!",
      error: "Failed to create a new blank",
    });
  };

  const openSidePanel = (task: any) => {
    if (task) {
      setSelectedTask(task);
      setTaskName(task.title);
      setTaskId(task._id);
      setAssignee(task.assignee);
      setReporter(task.reporter);
      setWhen(task.when);
      setDescription(task.desc);
      descriptionRef.current = task.desc;
      setPriority(task.priority);
      setStatus(task.status);
    }
    setIsPanelOpen(true);
  };

  const resetForm = () => {
    setTaskName("");
    setTaskId("");
    setAssignee("");
    setReporter("");
    setWhen("");
    setDescription("");
    setPriority("");
    setStatus("");
  };

  const closeSidePanel = () => {
    setIsPanelOpen(false);
    setSelectedTask(null);
    resetForm();
  };

  const saveData = () => {
    if (selectedTask?._id) return; // Avoid saving a new document if updating

    createTask({
      title: taskName,
      docId: documentId,
      status: status,
      desc: descriptionRef.current,
      createdAt: now.toDateString(),
      when: when,
      updatedAt: now.toDateString(),
      priority: priority,
      label: "new",
      assignee: assignee,
      reporter: reporter,
    }).then((document) => {
      toast.success("Created a new document!");
      closeSidePanel();
      resetForm();
    });
  };

  const updateData = () => {
    if (!selectedTask?._id) return; // Only update if a task is selected

    updateTask({
      id: selectedTask._id,
      title: taskName,
      status: status,
      desc: descriptionRef.current,
      when: when,
      priority: priority,
      label: "new",
      assignee: assignee,
      reporter: reporter,
      taskType: "This is static",
    }).then(() => {
      toast.success("Updated the document!");
    });
  };

  // handleDelete function using the `removeTask` mutation
  const handleDelete = (taskId: Id<"tasks">) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this task?");
    if (isConfirmed) {
      removeTask({ id: taskId }).then(() => {
        // console.log(`Task with ID ${taskId} deleted`);
      });
    }
  };

  return (
    <div className='h-screen w-full  my-9 items-center space-y-4 flex-col'>
      {/* Render Task Table and Side Panel */}
      <div className='p-4'>
        <h1 className='text-2xl font-bold mb-4'>Task Table</h1>
        <TaskTable Tasks={tasks} docId={documentId} onUpdate={setTasks} />
      </div>
      {isPanelOpen && (
        <div
          className='fixed top-0 right-0 w-1/3 h-screen shadow-lg z-[100] p-4'
          style={{
            borderLeft: "1px solid black",
            maxHeight: "100vh",
            overflowY: "scroll",
            background: resolvedTheme === "dark" ? "black" : "white",
          }}>
          {/* Side Panel Content */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: "1em" }}>
            <button className='font-bold flex-row-reverse' onClick={closeSidePanel}>
              Close
            </button>
            <hr />
            {selectedTask && (
              <div
                className='font-bold flex-row-reverse'
                style={{ fontWeight: "normal", cursor: "pointer", marginTop: "2em" }}
                onClick={() => router.push(`/documents/${documentId}/tasks/${selectedTask._id}`)}>
                Open in new Page
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              width: "90%",
              padding: "1em",
            }}>
            {/* Task Form */}
            <h1 style={{ fontSize: "2em", fontWeight: "bold" }}>
              <input
                type='text'
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)} // handle change
                style={{ padding: ".5em" }}
              />
            </h1>

            {/* Assignee, Reporter, When, and Description fields... */}
            <RichTextEditor />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "80%",
              padding: "1em",
            }}>
            <button
              type='button'
              style={{ border: "2px solid black", padding: ".5em 3em", borderRadius: "5px" }}
              onClick={selectedTask?._id ? updateData : saveData}>
              SAVE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPage;
