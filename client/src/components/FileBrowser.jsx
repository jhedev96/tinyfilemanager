import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function FileBrowser() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('file');
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  async function fetchFiles() {
    try {
      const response = await fetch('/api/files');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    fetchFiles();
  }, []);

  async function handleCreateItem() {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newItemName, type: newItemType, path: '' }),
      });
      if (!response.ok) {
        throw new Error('Failed to create item');
      }
      setNewItemName('');
      setNewItemType('file');
      setCreateDialogOpen(false);
      fetchFiles();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDeleteItem(itemName) {
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: itemName, path: '' }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      fetchFiles();
    } catch (error) {
      setError(error.message);
    }
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>New Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Item</DialogTitle>
              <DialogDescription>
                Enter the name and type for the new item.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <RadioGroup
                  defaultValue="file"
                  className="col-span-3"
                  onValueChange={setNewItemType}
                  value={newItemType}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="r1" />
                    <Label htmlFor="r1">File</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="folder" id="r2" />
                    <Label htmlFor="r2">Folder</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateItem}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.name}>
              <TableCell>{file.isDirectory ? '📁' : '📄'} {file.name}</TableCell>
              <TableCell>{file.isDirectory ? '-' : file.size}</TableCell>
              <TableCell>{new Date(file.mtime).toLocaleString()}</TableCell>
              <TableCell>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(file.name)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default FileBrowser;
