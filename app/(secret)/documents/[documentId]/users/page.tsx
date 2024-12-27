// @ts-nocheck
"use client";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { api } from "@/convex/_generated/api";
import useSubscription from "@/hooks/use-subscription";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css"; // Import Quill styles
import { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "next-themes";
import axios from "axios";
// import { sendEmail } from "@/app/api/email";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface DocumentIdPageProps {
  params: {
    documentId: Id<"documents">;
  };
}

const TaskPage = ({ params }: DocumentIdPageProps) => {
  const { resolvedTheme } = useTheme();
  const createTask = useMutation(api.task.createDocument);
  const createInvite = useMutation(api.invites.createInvite);
  // const createTask = useMutation(api.user.cre);
  const updateTask = useMutation(api.task.updateTask);
  const removeTask = useMutation(api.task.remove);
  const { user } = useUser();
  const router = useRouter();
  
  const documentId = params.documentId;

  const getInvites = useQuery(api.invites.getInvites, { docId: documentId });
  
  const createDocument = useMutation(api.document.createDocument);

  const users = useQuery(api.user.getAllUsers);
  
  const taskList = useQuery(api.task.getTasksByDoc,  {
    docId: documentId,  // Pass the required argument here
  });

  const documents = useQuery(api.document.getAllDocuments);
  const { isLoading, plan } = useSubscription(
    user?.emailAddresses[0]?.emailAddress!
  );

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // State to store email input and invited users list
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState(getInvites?.length ? getInvites : [])
  const [invitedUsers, setInvitedUsers] = useState([] as any);

  useEffect(() => {
    setInvites(getInvites as any)
    // console.log('invites list - ', getInvites)
  }, [getInvites])

  // Function to handle inviting a user
  const handleInvite = async (e) => {
    e.preventDefault();
    if (email) {
      setInvitedUsers([...invitedUsers, { email, invitedAt: new Date().toLocaleString(), status: 'Pending' }]);
      // sendEmail(email, 'user1'); // Clear email input after inviting
      try {
        const { data } = await axios.post("/api/users", {
          email,
          userName: 'user1'
        });
        createInvite({
          email,
          docId: documentId,
          status: 'Pending'
        }).then((document) => {
          toast.success("Invite sent successfully");
          closeSidePanel()
          resetForm()
          // if (!expanded) {
          //   onExpand?.();
          // }
        }).catch(error => {
          toast.success(error.message);
        });
        // window.open(data, "_self");
        // setIsSubmitting(false);
      } catch (error) {
        // setIsSubmitting(false);
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  const [taskName, setTaskName] = useState('untitled');
  const [taskId, setTaskId] = useState('');
  const [assignee, setAssignee] = useState('');
  const [reporter, setReporter] = useState('');
  const [when, setWhen] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [tasks, setTasks] = useState([])
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
  };

  const RichTextEditor = () => {
  
    return (
      <div style={{ width: '90%', height: '30vh' }}>
        <ReactQuill theme="snow" value={descriptionRef.current || description} 
        onChange={handleDescriptionChange}  style={{ height: '60%'}} />
      </div>
    );
  };

  useEffect(() => {
    // console.log(taskList)
    setTasks(taskList as any);
  }, [taskList])

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
      setTaskName(task.title)
      setTaskId(task._id)
      setAssignee(task.assignee)
      setReporter(task.reporter)
      setWhen(task.when)
      setDescription(task.desc)
      descriptionRef.current = task.desc
      setPriority(task.priority)
      setStatus(task.status)
    }
    setIsPanelOpen(true);
  };

  const resetForm = () => {
    setTaskName('')
    setTaskId('')
    setAssignee('')
    setReporter('')
    setWhen('')
    setDescription('')
    setPriority('')
    setStatus('')
  }

  const closeSidePanel = () => {
    setIsPanelOpen(false);
    setSelectedTask(null);
    resetForm()
  };

  const saveData = () => {
    
      createTask({
        title: taskName,
        docId: documentId,
        status: status,
        desc: descriptionRef.current,
        createdAt: now.toDateString(),
        when: when,
        updatedAt: now.toDateString(),
        priority: priority,
        label: 'new',
        assignee: assignee,
        reporter: reporter
      }).then((document) => {
        toast.success("Created a new document!");
        closeSidePanel()
        resetForm()
        // if (!expanded) {
        //   onExpand?.();
        // }
      });
    };

    const updateData = () => {
        updateTask({
          id: selectedTask?._id,
          title: taskName,
          status: status,
          desc: descriptionRef.current,
          when: when,
          priority: priority,
          label: 'new',
          assignee: assignee,
          reporter: reporter
        }).then((document) => {
          toast.success("Updated the document!");
          closeSidePanel();
          resetForm();
          // if (!expanded) {
          //   onExpand?.();
          // }
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
    <div className="h-screen w-full flex my-9 items-center space-y-4 flex-col" style={{ width: '90vw', marginTop: '5em' }}>
      <div className="p-6  mx-auto bg-white rounded-xl shadow-md space-y-4" style={{ width: '80vw' }}>
      <h2 className="text-2xl font-bold text-center">Invite Users</h2>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email to invite"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          Invite
        </button>
      </form>

      {/* Invited users table */}
      <div>
        <table className="min-w-full bg-white" style={{ width: '80%', marginTop: '2em'}}>
          <thead>
            <tr>
              <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">
                Email
              </th>
              <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">
                Invited At
              </th>
              <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {invites?.length > 0 ? (
              invites?.map((user: any, index: any) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2 text-gray-700">{user.email}</td>
                  <td className="px-4 py-2 text-gray-500">{user.createdAt}</td>
                  <td className="px-4 py-2 text-gray-500">{user.status}</td>
                  <td className="px-4 py-2 text-gray-500">

                    {
                    user.status === 'Pending' && <button style={{ border: '2px solid black', padding: '.4em', fontWeight: 'bold' }}>Send Notification</button>
                    }
                    {user.status === 'Accepted' && <button style={{ border: '2px solid black', padding: '.4em', fontWeight: 'bold' }}>Remove</button>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-4 py-2 text-center text-gray-500">
                  No users invited yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
      {/* <div
        style={{
          width: "95%",
          padding: "1em 1em 0em 0em",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          borderBottom: "1px solid black",
        }}
      >
        <div 
          style={{
            width: "100%",
            padding: "1em 1em 0em 0em",
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
          }}
        >
          <p style={{ fontWeight: "bold", cursor: "pointer" }}>Users</p>
          <p style={{ fontWeight: "bold", marginLeft: "1em", cursor: "pointer" }}>
            Task
          </p>
          <p style={{ fontWeight: "bold", marginLeft: "1em", cursor: "pointer" }}>
            Invites
          </p>
        </div>
        <div>
          <button style={{ fontWeight: 'bold', fontSize: '2em', color: 'blue' }} onClick={() => openSidePanel(null)}>+</button>
        </div>
      </div> */}
      
    </div>
  );
};

export default TaskPage;
