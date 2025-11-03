import React, { memo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Edit2, Trash2, FileText } from 'lucide-react';
import { useWorkflowContext } from '../../../context/workflowContext';
import { NodeIOPorts } from '../../../components/NodeIOPorts';
import specificationData from './specification.json';

interface FormInput {
    name: string;
    type: 'checkbox' | 'text-input' | 'dropdown' | 'file';
    multiple_selections?: boolean;
    options?: string[];
    dtype?: string;
    storage_url?: string;
    stored_file_id?: string;
}

interface BusinessNodeSpec {
    name: string;
    color: string;
    form_inputs: FormInput[];
    submit_endpoint: string;
}

interface BusinessNodeProps extends NodeProps {
    specIndex: number; // Index of the node in specification.json
}

const specification = specificationData as { nodes: BusinessNodeSpec[] };

export const BusinessNode = memo<BusinessNodeProps>(({ data, id, selected, specIndex }) => {
    const nodeData = data as any;
    const spec: BusinessNodeSpec = specification.nodes[specIndex];

    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(nodeData.label || '');
    const [showFormPopup, setShowFormPopup] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [fileIds, setFileIds] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<{ status: number; message: string } | null>(null);

    const { updateNode, deleteNode } = useWorkflowContext();

    const handleLabelSubmit = () => {
        if (labelValue.trim()) {
            updateNode(id, { label: labelValue.trim() });
        }
        setIsEditing(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLabelSubmit();
        } else if (e.key === 'Escape') {
            setLabelValue(nodeData.label || '');
            setIsEditing(false);
        }
    };

    const handleNodeDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowFormPopup(true);
    };

    const handleFileUpload = async (fieldName: string, file: File, storageUrl: string) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(storageUrl, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                const fileId = result.id || result.stored_filid || 'uploaded';
                setFileIds(prev => ({ ...prev, [fieldName]: fileId }));
                return fileId;
            } else {
                alert(`File upload failed: ${response.statusText}`);
                return null;
            }
        } catch (error) {
            alert(`File upload error: ${error}`);
            return null;
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionResult(null);

        // Prepare submission data
        const submissionData: Record<string, any> = { ...formData };

        // Add file IDs to submission data
        spec.form_inputs.forEach(input => {
            if (input.type === 'file' && fileIds[input.name]) {
                submissionData[input.name] = fileIds[input.name];
            }
        });

        try {
            const response = await fetch(spec.submit_endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            setSubmissionResult({
                status: response.status,
                message: response.ok ? `${response.status} OK` : `${response.status} ${response.statusText}`,
            });
        } catch (error) {
            setSubmissionResult({
                status: 0,
                message: `Error: ${error}`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormDataChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const nodeHeight = 120;

    return (
        <>
            <div
                className={`
                    relative group rounded-lg border-2 transition-all duration-200
                    ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                    hover:shadow-lg
                    w-[200px] shadow-md
                    text-white
                `}
                style={{
                    height: `${nodeHeight}px`,
                    minHeight: `${nodeHeight}px`,
                    minWidth: '200px',
                    backgroundColor: spec.color,
                    borderColor: spec.color,
                }}
                onDoubleClick={handleNodeDoubleClick}
            >
                {/* I/O Ports */}
                <NodeIOPorts nodeId={id} data={nodeData} />

                {/* Basic, functional handles */}
                <Handle type="source" position={Position.Top} />
                <Handle type="target" position={Position.Top} />
                <Handle type="source" position={Position.Bottom} />
                <Handle type="target" position={Position.Bottom} />
                <Handle type="source" position={Position.Left} />
                <Handle type="target" position={Position.Left} />
                <Handle type="source" position={Position.Right} />
                <Handle type="target" position={Position.Right} />

                {/* Node Content */}
                <div className="p-4 flex flex-col items-center space-y-2 cursor-pointer h-full">
                    <div className="flex items-center space-x-2">
                        <FileText size={16} />
                        <span className="text-xs font-medium tracking-wide opacity-80">
                            {spec.name}
                        </span>
                    </div>

                    {isEditing ? (
                        <input
                            type="text"
                            value={labelValue}
                            onChange={(e) => setLabelValue(e.target.value)}
                            onBlur={handleLabelSubmit}
                            onKeyDown={handleKeyPress}
                            className="bg-white text-gray-900 px-2 py-1 rounded text-sm font-medium text-center border focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white hover:text-blue-200 transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={12} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(id);
                        }}
                        className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white hover:text-red-200 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Form Popup */}
            {showFormPopup && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
                    onClick={() => setShowFormPopup(false)}
                    style={{ zIndex: 9999 }}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
                        style={{ width: '1400px', maxWidth: '90vw', height: '85vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center shadow-md">
                            <h2 className="text-xl font-bold text-white">
                                {spec.name} - {nodeData.label || 'Untitled'}
                            </h2>
                            <button
                                onClick={() => setShowFormPopup(false)}
                                className="text-white hover:text-gray-200 text-2xl font-bold transition-colors w-8 h-8 flex items-center justify-center rounded hover:bg-white/20"
                                title="Close"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-8 overflow-y-auto flex-1 bg-gray-50">
                            <div className="max-w-4xl mx-auto space-y-6">
                                {spec.form_inputs.map((input, index) => (
                                    <div key={index} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {input.name}
                                        </label>

                                        {/* Text Input */}
                                        {input.type === 'text-input' && (
                                            <input
                                                type={input.dtype || 'text'}
                                                value={formData[input.name] || ''}
                                                onChange={(e) => handleFormDataChange(input.name, e.target.value)}
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder={`Enter ${input.name}`}
                                            />
                                        )}

                                        {/* Checkbox */}
                                        {input.type === 'checkbox' && (
                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                {input.options?.map((option, optIndex) => (
                                                    <label key={optIndex} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2.5 rounded-lg transition-colors border border-gray-200">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                input.multiple_selections
                                                                    ? (formData[input.name] || []).includes(option)
                                                                    : formData[input.name] === option
                                                            }
                                                            onChange={(e) => {
                                                                if (input.multiple_selections) {
                                                                    const current = formData[input.name] || [];
                                                                    if (e.target.checked) {
                                                                        handleFormDataChange(input.name, [...current, option]);
                                                                    } else {
                                                                        handleFormDataChange(
                                                                            input.name,
                                                                            current.filter((o: string) => o !== option)
                                                                        );
                                                                    }
                                                                } else {
                                                                    handleFormDataChange(
                                                                        input.name,
                                                                        e.target.checked ? option : null
                                                                    );
                                                                }
                                                            }}
                                                            className="rounded w-4 h-4 text-blue-600"
                                                        />
                                                        <span className="text-sm text-gray-700 font-medium">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* Dropdown */}
                                        {input.type === 'dropdown' && (
                                            <select
                                                value={formData[input.name] || ''}
                                                onChange={(e) => handleFormDataChange(input.name, e.target.value)}
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                            >
                                                <option value="">Select {input.name}</option>
                                                {input.options?.map((option, optIndex) => (
                                                    <option key={optIndex} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        {/* File Input */}
                                        {input.type === 'file' && (
                                            <div className="space-y-2">
                                                <input
                                                    type="file"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file && input.storage_url) {
                                                            const fileId = await handleFileUpload(
                                                                input.name,
                                                                file,
                                                                input.storage_url
                                                            );
                                                            if (fileId) {
                                                                handleFormDataChange(input.name, file.name);
                                                            }
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                                                />
                                                {fileIds[input.name] && (
                                                    <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg p-2.5">
                                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                        <p className="text-xs font-medium text-green-700">
                                                            Uploaded - ID: {fileIds[input.name]}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Submission Result */}
                                {submissionResult && (
                                    <div
                                        className={`p-4 rounded-lg border ${
                                            submissionResult.status >= 200 && submissionResult.status < 300
                                                ? 'bg-green-50 border-green-300 text-green-800'
                                                : 'bg-red-50 border-red-300 text-red-800'
                                        }`}
                                    >
                                        <p className="font-bold text-base mb-1">Server Response:</p>
                                        <p className="text-sm">{submissionResult.message}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex gap-3 pt-4 sticky bottom-0 bg-gray-50 pb-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex-1 py-3 px-6 rounded-lg font-semibold text-base text-white transition-all duration-200 shadow-sm ${
                                            isSubmitting
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                                        }`}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Form'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowFormPopup(false)}
                                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-base text-gray-700 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
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
