// @ts-nocheck
"use client";

import Cover from "@/components/shared/cover";
import Toolbar from "@/components/shared/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useRef, useState } from "react";
import "@blocknote/core/style.css";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "react-quill/dist/quill.snow.css"; // Import Quill styles

interface DocumentIdPageProps {
  params: {
    taskId: Id<"tasks">;
  };
}

const TaskIdage = ({ params }: DocumentIdPageProps) => {

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const RichTextEditor = () => {
  
  return (
    <div style={{ width: '90%', height: '30vh' }}>
      <ReactQuill theme="snow" value={descriptionRef.current} 
      onChange={handleDescriptionChange}  style={{ height: '60%'}} />
    </div>
  );
};
const [taskName, setTaskName] = useState('untitled');
const [taskId, setTaskId] = useState('');
const [assignee, setAssignee] = useState('');
const [reporter, setReporter] = useState('');
const [when, setWhen] = useState('');
const [description, setDescription] = useState('');
const [priority, setPriority] = useState('');
const [url, setUrl] = useState('');
const [status, setStatus] = useState('');
const [tasks, setTasks] = useState([])
const now = new Date().toLocaleDateString();

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
  const updateTask = useMutation(api.task.updateTask);

  const selectedTask = useQuery(api.task.getTaskById,  {
    taskId: params.taskId,  // Pass the required argument here
  });
  useEffect(() => {
    if (selectedTask) {
      setTaskName(selectedTask.title)
      setTaskId(selectedTask._id)
      setAssignee(selectedTask.assignee)
      setReporter(selectedTask.reporter)
      setWhen(selectedTask?.when || '')
      setDescription(selectedTask.desc)
      descriptionRef.current = selectedTask.desc;
      setPriority(selectedTask.priority || '')
      setStatus(selectedTask.status)
    }
  }, [selectedTask])

  const users = useQuery(api.user.getAllUsers);

  const document = false
  // const document = useQuery(api.document.getDocumentById, {
  //   id: params.taskId as Id<"documents">,
  // });
  const Editor = useMemo(
    () => dynamic(() => import("@/components/shared/editor"), { ssr: false }),
    []
  );

  if (document === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) return null;

  // const onChange = (value: string) => {
  //   updateFields({
  //     id: document._id,
  //     content: value,
  //   });
  // };

  
  const resetForm = () => {
    setTaskName('')
    setTaskId('')
    setAssignee('')
    setReporter('')
    setWhen('')
    setDescription('')
    setPriority('')
    setUrl('')
    setStatus('')
  }

  const updateData = () => {
    if (!selectedTask?._id) return;

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
        resetForm();
        // if (!expanded) {
        //   onExpand?.();
        // }
      });
    };

  return (
    <div className="h-screen w-full flex justify-center items-center space-y-4 flex-col">
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', width: '100%', border: '1px solid #e7e7e7', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', padding: '1em', marginTop: '5em', maxHeight: '90vh', overflowY: 'scroll' }} >
        <h1 style={{ fontSize: '2em', fontWeight: 'bold' }}>
          <input type="text" value={taskName}
              onChange={(e) => setTaskName(e.target.value)} style={{ padding: '1em' }}></input>
        </h1>
        <hr />

        {/* Assignee */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%', padding: '1em' }}>
            <h6 style={{ width: '30%', fontWeight: '600' }}>Assignee</h6>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ border: '1px solid silver' }}>
            <option value=''>Select Assignee</option>
            {users && users?.length && users?.map(u => {
                return (
                <option value={u._id}>{u.familyName}</option>
                )
              })}
            </select>
          </div>
  
          {/* Reporter */}
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%', padding: '1em' }}>
            <h6 style={{ width: '30%', fontWeight: '600' }}>Reporter</h6>
            <select value={reporter} onChange={(e) => setReporter(e.target.value)} style={{ border: '1px solid silver' }}>
            <option value=''>Select Reporter</option>
            {users && users?.length && users?.map(u => {
                return (
                <option value={u._id}>{u.familyName}</option>
                )
              })}
            </select>
          </div>
        
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%', padding: '1em' }}>
        <h6 style={{ width: '30%', fontWeight: '600' }}>when</h6>
        <input type="datetime-local" name="When" id="when" value={when} onChange={(e) => setWhen(e.target.value)}  style={{ border: '1px solid silver' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%', padding: '1em' }}>
        <h6 style={{ width: '30%', fontWeight: '600' }}>description</h6>
        {/* <input type="text" style={{ border: '1px solid silver' }} /> */}
        <RichTextEditor />

        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%', padding: '1em' }}>
        <h6 style={{ width: '30%', fontWeight: '600' }}>priority</h6> <select name="" id="" style={{ border: '1px solid silver' }} value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        </div>
  
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%', padding: '1em' }}>
          <h6 style={{ width: '30%', fontWeight: '600' }}>completed</h6> 
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ border: '1px solid silver' }}>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="In Testing">In Testing</option>
              <option value="In PR">In PR</option>
              <option value="Completed">Completed</option>
            </select>
        </div>
        {selectedTask?.createdAt && <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%', padding: '1em' }}>
        <h6 style={{ width: '30%', fontWeight: '600' }}>Created</h6> <p>{now}</p>
        </div>}
        <hr />
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', padding: '1em', fontWeight: 'bold' }}>
          <button type="button" style={{ border: '2px solid black', padding: '.5em 3em', borderRadius: '5px', background: '#f3f3f3' }} onClick={updateData}>SAVE</button>
        </div>
      </div>
      </div>
  );
};

export default TaskIdage;
