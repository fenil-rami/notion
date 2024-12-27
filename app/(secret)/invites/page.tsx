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
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const DocumentPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const allInvites = useQuery(api.invites.getAllInvites);
  const [invites, setInvites] = useState(allInvites?.length ? allInvites : [])
  const createDocument = useMutation(api.document.createDocument);
  const updateInvite = useMutation(api.invites.updateInvites);

  const documents = useQuery(api.document.getAllDocuments);
  const { isLoading, plan } = useSubscription(
    user?.emailAddresses[0]?.emailAddress!
  );

  useEffect(() => {
    setInvites(allInvites as any)
  }, [allInvites])

  const onCreateDocument = () => {
    if (documents?.length && documents.length >= 3 && plan === "Free") {
      toast.error("You can only create 3 documents in the free plan");
      return;
    }

    const promise = createDocument({
      title: "Untitled",
    }).then((docId) => router.push(`/documents/${docId}`));

    toast.promise(promise, {
      loading: "Createing a new blank...",
      success: "Created a new blank!",
      error: "Failed to create a new blank",
    });
  };

  const handleInvite = (isAccept: boolean, id: any) => {
    updateInvite({
      id,
       status: isAccept ? 'Accepted' : 'Rejected'
    })
  }

  return (
    <div className="h-screen w-full flex my-9 items-center space-y-4 flex-col" style={{ width: '90vw', marginTop: '5em' }}>
      <div className="p-6  mx-auto bg-white rounded-xl shadow-md space-y-4" style={{ width: '80vw' }}>
      <h2 className="text-2xl font-bold text-center">Invite Users</h2>
      <table className="min-w-full bg-white" style={{ width: '80%', marginTop: '2em'}}>
          <thead>
            <tr>
              <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">
                Email
              </th>
              <th className="px-4 py-2 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">
                Doc
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
                  <td className="px-4 py-2 text-gray-700">{user.createdBy}</td>
                  <td className="px-4 py-2 text-gray-700">{user.docId                }</td>
                  <td className="px-4 py-2 text-gray-500">{user.createdAt}</td>
                  <td className="px-4 py-2 text-gray-500">{user.status}</td>
                  <td className="px-4 py-2 text-gray-500">

                    {
                    user.status === 'Pending' &&<> <button style={{ border: '2px solid black', padding: '.4em', fontWeight: 'bold' }} onClick={() => handleInvite(true, user?._id)}>Accept</button>
                    <button style={{ border: '2px solid black', padding: '.4em', fontWeight: 'bold', marginLeft: '1em' }} onClick={() => handleInvite(false, user?._id)}>Reject</button></>
                    }
                    {user.status === 'Accepted' && <button style={{ border: '2px solid black', padding: '.4em', fontWeight: 'bold' }} onClick={() => handleInvite(false, user?._id)}>Remove</button>}
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
  );
};

export default DocumentPage;
