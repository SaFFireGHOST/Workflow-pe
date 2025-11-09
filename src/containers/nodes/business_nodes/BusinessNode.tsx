import React, { memo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Edit2, Trash2, FileText } from 'lucide-react';
import { useWorkflowContext } from '../../../context/workflowContext';
import specificationData from './specification.json';

interface AccessField {
    name: string;
    access: 'write' | 'read';
    type: 'string' | 'dropdown' | 'checkbox' | 'file';
    options?: string[];
}

interface BusinessNodeSpec {
    id: string;
    type: string;
    label: string;
    roles: string[];
    color?: string;
    access: {
        fields: AccessField[];
    };
    storage_url?: string;
    submit_endpoint?: string;
}

interface BusinessNodeProps extends NodeProps {
    specIndex: number;
}

const specification = specificationData as { nodes: BusinessNodeSpec[] };

export const BusinessNode = memo<BusinessNodeProps>(({ data, id, selected, specIndex }) => {
    const nodeData = data as any;
    const spec = specification.nodes[specIndex];
    const { updateNode, deleteNode } = useWorkflowContext();

    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(nodeData.label || '');
    const [showFormPopup, setShowFormPopup] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [fileIds, setFileIds] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<{ status: number; message: string } | null>(null);

    const handleLabelSubmit = () => {
        if (labelValue.trim()) updateNode(id, { label: labelValue.trim() });
        setIsEditing(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleLabelSubmit();
        if (e.key === 'Escape') {
            setLabelValue(nodeData.label || '');
            setIsEditing(false);
        }
    };

    const handleNodeDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowFormPopup(true);
    };

    const handleFormDataChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (fieldName: string, file: File, storageUrl: string) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(storageUrl, { method: 'POST', body: formData });
            if (response.ok) {
                const result = await response.json();
                const fileId = result.id || result.stored_file_id || 'uploaded';
                setFileIds(prev => ({ ...prev, [fieldName]: fileId }));
                return fileId;
            } else {
                alert(`File upload failed: ${response.statusText}`);
                return null;
            }
        } catch (err) {
            alert(`File upload error: ${err}`);
            return null;
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionResult(null);

        const submissionData: Record<string, any> = { ...formData };
        spec.access.fields.forEach(f => {
            if (f.type === 'file' && fileIds[f.name]) {
                submissionData[f.name] = fileIds[f.name];
            }
        });

        if (!spec.submit_endpoint) {
            console.log('No submit endpoint provided. Data:', submissionData);
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(spec.submit_endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });

            if (response.ok) {
                // Optional: download submitted JSON locally
                const blob = new Blob([JSON.stringify(submissionData, null, 2)], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${spec.label.replace(/\s+/g, '_')}_submission.json`;
                link.click();
            }

            setSubmissionResult({
                status: response.status,
                message: response.ok
                    ? `${response.status} OK`
                    : `${response.status} ${response.statusText}`,
            });
        } catch (err) {
            setSubmissionResult({ status: 0, message: `Error: ${err}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const nodeHeight = 120;
    const nodeColor = spec.color || '#6b7280';

    return (
        <>
            <div
                className={`relative group rounded-lg border-2 transition-all duration-200
                    ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                    hover:shadow-lg w-[200px] shadow-md text-white`}
                style={{
                    height: `${nodeHeight}px`,
                    backgroundColor: nodeColor,
                    borderColor: nodeColor,
                }}
                onDoubleClick={handleNodeDoubleClick}
            >
                <Handle type="source" position={Position.Top} />
                <Handle type="target" position={Position.Top} />
                <Handle type="source" position={Position.Bottom} />
                <Handle type="target" position={Position.Bottom} />
                <Handle type="source" position={Position.Left} />
                <Handle type="target" position={Position.Left} />
                <Handle type="source" position={Position.Right} />
                <Handle type="target" position={Position.Right} />

                <div className="p-4 flex flex-col items-center space-y-2 cursor-pointer h-full">
                    <div className="flex items-center space-x-2">
                        <FileText size={16} />
                        <span className="text-xs font-medium opacity-80">{spec.label}</span>
                    </div>

                    {isEditing ? (
                        <input
                            type="text"
                            value={labelValue}
                            onChange={(e) => setLabelValue(e.target.value)}
                            onBlur={handleLabelSubmit}
                            onKeyDown={handleKeyPress}
                            className="bg-white text-gray-900 px-2 py-1 rounded text-sm text-center border focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div
                            className="font-medium text-center cursor-text hover:bg-black hover:bg-opacity-10 px-2 py-1 rounded"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                        >
                            {nodeData.label || 'Untitled'}
                        </div>
                    )}
                    <p className="text-xs opacity-75 text-center">Double-click to open form</p>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded"
                        title="Edit"
                    >
                        <Edit2 size={12} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(id);
                        }}
                        className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded"
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {showFormPopup &&
                ReactDOM.createPortal(
                    <div
                        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
                        onClick={() => setShowFormPopup(false)}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
                            style={{ width: '900px', maxWidth: '90vw', height: '80vh' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
                                <h2 className="font-bold text-lg">{spec.label}</h2>
                                <button onClick={() => setShowFormPopup(false)} className="text-xl font-bold">×</button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
                                {spec.access.fields.map((field, idx) => (
                                    <div key={idx} className="bg-white border p-4 rounded-lg shadow-sm">
                                        <label className="block text-sm font-semibold mb-2">{field.name}</label>

                                        {field.type === 'string' && (
                                            <input
                                                type="text"
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleFormDataChange(field.name, e.target.value)}
                                                disabled={field.access === 'read'}
                                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                        )}

                                        {field.type === 'dropdown' && (
                                            <select
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleFormDataChange(field.name, e.target.value)}
                                                disabled={field.access === 'read'}
                                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="">Select {field.name}</option>
                                                {field.options?.map((opt, i) => (
                                                    <option key={i} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        )}

                                        {field.type === 'checkbox' && (
                                            <div className="flex flex-col gap-2">
                                                {field.options?.map((opt, i) => (
                                                    <label key={i} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={Array.isArray(formData[field.name])
                                                                ? formData[field.name].includes(opt)
                                                                : formData[field.name] === opt}
                                                            onChange={(e) => {
                                                                if (Array.isArray(formData[field.name])) {
                                                                    const current = [...formData[field.name]];
                                                                    if (e.target.checked) current.push(opt);
                                                                    else current.splice(current.indexOf(opt), 1);
                                                                    handleFormDataChange(field.name, current);
                                                                } else {
                                                                    handleFormDataChange(field.name, e.target.checked ? opt : null);
                                                                }
                                                            }}
                                                            disabled={field.access === 'read'}
                                                        />
                                                        <span>{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {field.type === 'file' && (
                                            <div className="space-y-2">
                                                <input
                                                    type="file"
                                                    disabled={field.access === 'read'}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file && spec.storage_url) {
                                                            const fileId = await handleFileUpload(field.name, file, spec.storage_url);
                                                            if (fileId) handleFormDataChange(field.name, file.name);
                                                        }
                                                    }}
                                                />
                                                {fileIds[field.name] && (
                                                    <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
                                                        Uploaded (ID: {fileIds[field.name]})
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {submissionResult && (
                                    <div
                                        className={`p-4 rounded border ${
                                            submissionResult.status >= 200 && submissionResult.status < 300
                                                ? 'bg-green-50 border-green-300 text-green-800'
                                                : 'bg-red-50 border-red-300 text-red-800'
                                        }`}
                                    >
                                        {submissionResult.message}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`px-6 py-2 rounded-lg text-white font-semibold ${
                                            isSubmitting
                                                ? 'bg-gray-400'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowFormPopup(false)}
                                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
});

BusinessNode.displayName = 'BusinessNode';
