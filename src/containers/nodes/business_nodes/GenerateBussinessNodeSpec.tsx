import React, { useState } from 'react';

// Types based on specification.json
type InputType = 'checkbox' | 'text-input' | 'dropdown' | 'file';

interface FormInput {
    name: string;
    type: InputType;
    multiple_selections?: boolean;
    options?: string[];
    dtype?: string;
    storage_url?: string;
    stored_file_id?: string;
}

interface BusinessNode {
    name: string;
    color: string;
    form_inputs: FormInput[];
    submit_endpoint: string;
}

interface Specification {
    nodes: BusinessNode[];
}

const GenerateBusinessNodeSpec: React.FC = () => {
    const [nodes, setNodes] = useState<BusinessNode[]>([]);
    const [isBuilding, setIsBuilding] = useState(false);
    const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);

    // Current node form states
    const [nodeName, setNodeName] = useState('');
    const [nodeColor, setNodeColor] = useState('blue');
    const [submitEndpoint, setSubmitEndpoint] = useState('http://localhost:8080');
    const [formInputs, setFormInputs] = useState<FormInput[]>([]);

    // Current row being edited
    const [editingRow, setEditingRow] = useState<FormInput | null>(null);
    const [showRowForm, setShowRowForm] = useState(false);

    const startBuildingNode = () => {
        setIsBuilding(true);
        setEditingNodeIndex(null);
        setNodeName('');
        setNodeColor('blue');
        setSubmitEndpoint('http://localhost:8080');
        setFormInputs([]);
    };

    const editExistingNode = (index: number) => {
        const node = nodes[index];
        setIsBuilding(true);
        setEditingNodeIndex(index);
        setNodeName(node.name);
        setNodeColor(node.color);
        setSubmitEndpoint(node.submit_endpoint);
        setFormInputs([...node.form_inputs]);
    };

    const addNewRow = () => {
        setEditingRow({
            name: '',
            type: 'text-input',
        });
        setShowRowForm(true);
    };

    const saveRow = () => {
        if (editingRow && editingRow.name.trim()) {
            setFormInputs([...formInputs, editingRow]);
            setEditingRow(null);
            setShowRowForm(false);
        }
    };

    const deleteRow = (index: number) => {
        setFormInputs(formInputs.filter((_, i) => i !== index));
    };

    const deleteBusinessNode = (index: number) => {
        if (window.confirm(`Are you sure you want to delete "${nodes[index].name}"?`)) {
            setNodes(nodes.filter((_, i) => i !== index));
        }
    };

    const updateEditingRow = (field: string, value: any) => {
        if (editingRow) {
            setEditingRow({ ...editingRow, [field]: value });
        }
    };

    const createBusinessNode = () => {
        if (!nodeName.trim()) {
            alert('Please enter a node name');
            return;
        }

        const newNode: BusinessNode = {
            name: nodeName,
            color: nodeColor,
            form_inputs: formInputs,
            submit_endpoint: submitEndpoint,
        };

        if (editingNodeIndex !== null) {
            // Update existing node
            const updatedNodes = [...nodes];
            updatedNodes[editingNodeIndex] = newNode;
            setNodes(updatedNodes);
        } else {
            // Create new node
            setNodes([...nodes, newNode]);
        }

        setIsBuilding(false);
        setEditingNodeIndex(null);
        setNodeName('');
        setNodeColor('blue');
        setSubmitEndpoint('http://localhost:8080');
        setFormInputs([]);
    };

    const exportSpecification = () => {
        const spec: Specification = {
            nodes: nodes,
        };

        const dataStr = JSON.stringify(spec, null, 4);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'specification.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg p-4 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Business Nodes</h2>

                <button
                    onClick={startBuildingNode}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded mb-4 transition duration-200"
                >
                    + Build New Business Node
                </button>

                <div className="space-y-2">
                    {nodes.map((node, index) => (
                        <div
                            key={index}
                            className="p-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition duration-150 cursor-pointer"
                            onClick={() => editExistingNode(index)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: node.color }}
                                    ></div>
                                    <span className="font-medium text-sm">{node.name}</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteBusinessNode(index);
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition duration-200"
                                    title="Delete node"
                                >
                                    Delete
                                </button>
                            </div>
                            <span className="text-xs text-gray-500">
                                {node.form_inputs.length} inputs
                            </span>
                        </div>
                    ))}
                </div>

                {nodes.length > 0 && (
                    <button
                        onClick={exportSpecification}
                        className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
                    >
                        Export Specification
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {!isBuilding ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <h2 className="text-2xl font-semibold mb-2">
                                Business Node Builder
                            </h2>
                            <p>Click "Build New Business Node" to get started</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            {editingNodeIndex !== null ? 'Edit Business Node' : 'Create Business Node'}
                        </h2>

                        {/* Node Details Form */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h3 className="text-lg font-semibold mb-4">Node Details</h3>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Node Name
                                    </label>
                                    <input
                                        type="text"
                                        value={nodeName}
                                        onChange={(e) => setNodeName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., bnode1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Node Color
                                    </label>
                                    <select
                                        value={nodeColor}
                                        onChange={(e) => setNodeColor(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="blue">Blue</option>
                                        <option value="red">Red</option>
                                        <option value="green">Green</option>
                                        <option value="yellow">Yellow</option>
                                        <option value="purple">Purple</option>
                                        <option value="orange">Orange</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Submit Endpoint
                                </label>
                                <input
                                    type="text"
                                    value={submitEndpoint}
                                    onChange={(e) => setSubmitEndpoint(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="http://localhost:8080"
                                />
                            </div>
                        </div>

                        {/* Form Inputs Table */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Form Inputs</h3>
                                <button
                                    onClick={addNewRow}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
                                >
                                    + Add Input
                                </button>
                            </div>

                            {/* Table */}
                            {formInputs.length > 0 && (
                                <div className="overflow-x-auto mb-4">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                                                    Name
                                                </th>
                                                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                                                    Type
                                                </th>
                                                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                                                    Details
                                                </th>
                                                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formInputs.map((input, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 px-4 py-2 text-sm">
                                                        {input.name}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-sm">
                                                        {input.type}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-sm">
                                                        {input.type === 'checkbox' && (
                                                            <div>
                                                                <span className="font-medium">Multiple: </span>
                                                                {input.multiple_selections ? 'Yes' : 'No'}
                                                                {input.options && (
                                                                    <>
                                                                        <br />
                                                                        <span className="font-medium">Options: </span>
                                                                        {input.options.join(', ')}
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                        {input.type === 'dropdown' && input.options && (
                                                            <div>
                                                                <span className="font-medium">Options: </span>
                                                                {input.options.join(', ')}
                                                            </div>
                                                        )}
                                                        {input.type === 'text-input' && input.dtype && (
                                                            <div>
                                                                <span className="font-medium">Data Type: </span>
                                                                {input.dtype}
                                                            </div>
                                                        )}
                                                        {input.type === 'file' && (
                                                            <div>
                                                                <span className="font-medium">Storage URL: </span>
                                                                {input.storage_url}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-center">
                                                        <button
                                                            onClick={() => deleteRow(index)}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition duration-200"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Row Form */}
                            {showRowForm && editingRow && (
                                <div className="bg-gray-50 border border-gray-300 rounded p-4 mb-4">
                                    <h4 className="font-semibold mb-3">Add New Input</h4>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Input Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editingRow.name}
                                                onChange={(e) => updateEditingRow('name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., Name, Course, etc."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Input Type
                                            </label>
                                            <select
                                                value={editingRow.type}
                                                onChange={(e) => {
                                                    const newType = e.target.value as InputType;
                                                    setEditingRow({ name: editingRow.name, type: newType });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="text-input">Text Input</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="dropdown">Dropdown</option>
                                                <option value="file">File</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Conditional Fields based on Type */}
                                    {editingRow.type === 'checkbox' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={editingRow.multiple_selections || false}
                                                        onChange={(e) =>
                                                            updateEditingRow('multiple_selections', e.target.checked)
                                                        }
                                                        className="rounded"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Allow Multiple Selections
                                                    </span>
                                                </label>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Options
                                                    </label>
                                                    <button
                                                        onClick={() => {
                                                            const currentOptions = editingRow.options || [];
                                                            updateEditingRow('options', [...currentOptions, '']);
                                                        }}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition duration-200"
                                                    >
                                                        + Add Option
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(editingRow.options || []).map((option, index) => (
                                                        <div key={index} className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(e) => {
                                                                    const newOptions = [...(editingRow.options || [])];
                                                                    newOptions[index] = e.target.value;
                                                                    updateEditingRow('options', newOptions);
                                                                }}
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder={`Option ${index + 1}`}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const newOptions = (editingRow.options || []).filter((_, i) => i !== index);
                                                                    updateEditingRow('options', newOptions);
                                                                }}
                                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition duration-200"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {(!editingRow.options || editingRow.options.length === 0) && (
                                                        <p className="text-sm text-gray-500 italic">No options added yet. Click "Add Option" to add one.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {editingRow.type === 'dropdown' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Options
                                                </label>
                                                <button
                                                    onClick={() => {
                                                        const currentOptions = editingRow.options || [];
                                                        updateEditingRow('options', [...currentOptions, '']);
                                                    }}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition duration-200"
                                                >
                                                    + Add Option
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {(editingRow.options || []).map((option, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => {
                                                                const newOptions = [...(editingRow.options || [])];
                                                                newOptions[index] = e.target.value;
                                                                updateEditingRow('options', newOptions);
                                                            }}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder={`Option ${index + 1}`}
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newOptions = (editingRow.options || []).filter((_, i) => i !== index);
                                                                updateEditingRow('options', newOptions);
                                                            }}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition duration-200"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!editingRow.options || editingRow.options.length === 0) && (
                                                    <p className="text-sm text-gray-500 italic">No options added yet. Click "Add Option" to add one.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {editingRow.type === 'text-input' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Data Type
                                            </label>
                                            <select
                                                value={editingRow.dtype || 'text'}
                                                onChange={(e) => updateEditingRow('dtype', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="email">Email</option>
                                                <option value="password">Password</option>
                                                <option value="date">Date</option>
                                            </select>
                                        </div>
                                    )}

                                    {editingRow.type === 'file' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Storage URL
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingRow.storage_url || 'http://localhost:8080'}
                                                    onChange={(e) => updateEditingRow('storage_url', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="http://localhost:8080"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Stored File ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingRow.stored_file_id || 'Not_Stored_Yet'}
                                                    onChange={(e) =>
                                                        updateEditingRow('stored_file_id', e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Not_Stored_Yet"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={saveRow}
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200"
                                        >
                                            Save Input
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowRowForm(false);
                                                setEditingRow(null);
                                            }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Create/Update Button */}
                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={createBusinessNode}
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded transition duration-200"
                            >
                                {editingNodeIndex !== null ? 'Update Business Node' : 'Create Business Node'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsBuilding(false);
                                    setEditingNodeIndex(null);
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded transition duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenerateBusinessNodeSpec;
